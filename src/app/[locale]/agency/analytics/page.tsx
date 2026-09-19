import { BarChart3, Lightbulb } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import TokenUsageChart from "@/components/admin/TokenUsageChart";
import CrewInsightCard from "@/components/dashboard/crew/CrewInsightCard";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/ui/EmptyState";
import MetricCard from "@/components/ui/MetricCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { requireAgencyAdmin } from "@/lib/agency/admin";
import { formatPercent, formatTokens } from "@/lib/agency/format";
import {
  ANALYTICS_WINDOWS,
  consumptionPercent,
  parseAnalyticsWindow,
  summarizeUsage,
  toTokenUsagePoints,
} from "@/lib/agency/usage";
import { readCrewMetadata } from "@/lib/dev-crew/recommendation";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const RECOMMENDATION_LIMIT = 20;

export default async function AgencyAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string | string[] }>;
}) {
  const { supabase, agency } = await requireAgencyAdmin();
  const days = parseAnalyticsWindow((await searchParams).days);
  const [t, locale, format] = await Promise.all([
    getTranslations("agency.analytics"),
    getLocale(),
    getFormatter(),
  ]);

  // Both reads run under the caller's own RLS (the agency-admin SELECT
  // policies), so no other agency's tenants can ever appear here.
  const { data: rows, error } = await supabase.rpc("get_agency_usage_summary", {
    p_agency_id: agency.id,
    p_days: days,
  });
  if (error) throw error;

  const usage = rows ?? [];
  const summary = summarizeUsage(usage);
  const chartPoints = toTokenUsagePoints(usage);
  const tenantNameById = new Map(usage.map((row) => [row.tenant_id, row.tenant_name]));

  const { data: recommendations, error: recommendationError } =
    usage.length > 0
      ? await supabase
          .from("audit_logs")
          .select("id, created_at, organization_id, metadata")
          .eq("action", "dev_crew.recommendation")
          .in("organization_id", usage.map((row) => row.tenant_id))
          .order("created_at", { ascending: false })
          .limit(RECOMMENDATION_LIMIT)
      : { data: [], error: null };
  if (recommendationError) throw recommendationError;

  const attention = summary.tenantsNearLimit + summary.tenantsOutOfTokens;
  const now = new Date();
  const relative = (iso: string | null) => (iso ? format.relativeTime(new Date(iso), now) : "—");

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <nav aria-label={t("window")} className="flex gap-1 rounded-lg border border-slate-800 p-1">
            {ANALYTICS_WINDOWS.map((option) => (
              <Link
                key={option}
                href={`/agency/analytics?days=${option}`}
                aria-current={option === days ? "true" : undefined}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
                  option === days ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:text-slate-100",
                )}
              >
                {t("days", { count: option })}
              </Link>
            ))}
          </nav>
        }
      />

      {usage.length === 0 ? (
        <Card>
          <EmptyState icon={BarChart3} title={t("emptyTitle")} description={t("emptyDescription")} />
        </Card>
      ) : (
        <>
          <section aria-label={t("title")} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label={t("requests")}
              value={formatTokens(locale, summary.totalRequests)}
              hint={t("requestsHint", { days })}
            />
            <MetricCard
              label={t("consumption")}
              value={formatPercent(locale, summary.consumptionPercent)}
              hint={t("consumptionHint", {
                used: formatTokens(locale, summary.tokensConsumed),
                granted: formatTokens(locale, summary.tokensGranted),
              })}
            />
            <MetricCard
              label={t("lowConfidence")}
              value={formatPercent(locale, summary.lowConfidenceRate)}
              hint={t("lowConfidenceHint", {
                low: formatTokens(locale, summary.lowConfidenceCount),
                total: formatTokens(locale, summary.totalCompletions),
                days,
              })}
            />
            <MetricCard
              label={t("attention")}
              value={formatTokens(locale, attention)}
              hint={
                attention === 0
                  ? t("attentionNone")
                  : t("attentionSome", { out: summary.tenantsOutOfTokens, near: summary.tenantsNearLimit })
              }
            />
          </section>
          <p className="-mt-2 text-xs text-slate-400">{t("tokenNote")}</p>

          <Card>
            <CardHeader>
              <CardTitle>{t("chartTitle")}</CardTitle>
              <CardDescription>{t("chartDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {chartPoints.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">{t("chartEmpty")}</p>
              ) : (
                <TokenUsageChart data={chartPoints} />
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <caption className="sr-only">{t("table.caption")}</caption>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.tenant")}</TableHead>
                    <TableHead className="text-end">{t("table.requests")}</TableHead>
                    <TableHead className="text-end">{t("table.lowConfidence")}</TableHead>
                    <TableHead className="text-end">{t("table.blocked")}</TableHead>
                    <TableHead className="text-end">{t("table.tokens")}</TableHead>
                    <TableHead>{t("table.lastActivity")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usage.map((row) => (
                    <TableRow key={row.tenant_id}>
                      <TableCell>
                        <p className="font-medium text-slate-100">{row.tenant_name}</p>
                        <p dir="ltr" className="text-start font-mono text-xs text-slate-400">
                          {row.tenant_slug}
                        </p>
                      </TableCell>
                      <TableCell dir="ltr" className="text-end font-mono text-slate-100">
                        {formatTokens(locale, row.rag_requests)}
                      </TableCell>
                      <TableCell dir="ltr" className="text-end font-mono text-slate-100">
                        {formatTokens(locale, row.low_confidence)}
                      </TableCell>
                      <TableCell dir="ltr" className="text-end font-mono text-slate-100">
                        {row.quota_exhausted > 0 ? (
                          <span className="text-status-error">{formatTokens(locale, row.quota_exhausted)}</span>
                        ) : (
                          0
                        )}
                      </TableCell>
                      <TableCell dir="ltr" className="text-end font-mono text-slate-100">
                        {row.quota_granted > 0 ? formatPercent(locale, consumptionPercent(row)) : "—"}
                      </TableCell>
                      <TableCell className="text-slate-400">{relative(row.last_activity_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <section>
            <h2 className="text-lg font-semibold tracking-tight text-slate-100">{t("crew.title")}</h2>
            <p className="mt-1 text-sm text-slate-400">{t("crew.description")}</p>
            <Card className="mt-4">
              {(recommendations ?? []).length === 0 ? (
                <EmptyState icon={Lightbulb} title={t("crew.emptyTitle")} description={t("crew.emptyDescription")} />
              ) : (
                <ol className="divide-y divide-slate-800">
                  {(recommendations ?? []).map((entry) => {
                    const { recommendation, negativeCount } = readCrewMetadata(entry.metadata);
                    return (
                      <CrewInsightCard
                        key={entry.id}
                        item={{
                          id: entry.id,
                          createdAt: entry.created_at,
                          recommendation,
                          negativeCount,
                          repeats: 1,
                        }}
                        now={now}
                        tenantName={(entry.organization_id && tenantNameById.get(entry.organization_id)) || t("crew.unknownTenant")}
                      />
                    );
                  })}
                </ol>
              )}
            </Card>
          </section>
        </>
      )}
    </PageContainer>
  );
}
