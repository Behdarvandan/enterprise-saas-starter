import { BarChart3, Lightbulb } from "lucide-react";
import { Link } from "@/i18n/navigation";
import StatCard from "@/components/agency/StatCard";
import TokenUsageChart from "@/components/admin/TokenUsageChart";
import Badge from "@/components/ui/Badge";
import { Card } from "@/components/ui/card";
import EmptyState from "@/components/ui/EmptyState";
import { requireAgencyAdmin } from "@/lib/agency/admin";
import { formatPercent, formatRelativeTime, formatTokens } from "@/lib/agency/format";
import {
  ANALYTICS_WINDOWS,
  consumptionPercent,
  parseAnalyticsWindow,
  summarizeUsage,
  toTokenUsagePoints,
} from "@/lib/agency/usage";

export const dynamic = "force-dynamic";

const RECOMMENDATION_LIMIT = 20;

interface DevCrewMetadata {
  recommendation?: string;
  negative_count?: number;
}

export default async function AgencyAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string | string[] }>;
}) {
  const { supabase, agency } = await requireAgencyAdmin();
  const days = parseAnalyticsWindow((await searchParams).days);

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-primary">Analytics</h1>
          <p className="mt-1 text-sm text-ink-muted">
            AI assistant usage across all of your tenants.
          </p>
        </div>
        <nav aria-label="Time window" className="flex gap-1 rounded-control border border-subtle p-1">
          {ANALYTICS_WINDOWS.map((option) => (
            <Link
              key={option}
              href={`/agency/analytics?days=${option}`}
              aria-current={option === days ? "true" : undefined}
              className={`rounded-control px-3 py-1 text-xs font-semibold transition-colors ${
                option === days
                  ? "bg-violet/15 text-violet-dim"
                  : "text-ink-muted hover:bg-surface-raised hover:text-ink-primary"
              }`}
            >
              {option} days
            </Link>
          ))}
        </nav>
      </div>

      {usage.length === 0 ? (
        <Card className="mt-8 rounded-interactive">
          <EmptyState
            icon={BarChart3}
            title="Nothing to analyze yet"
            description="Add tenants and allocate tokens on the Tenants page. Usage from their AI assistants will show up here."
          />
        </Card>
      ) : (
        <>
          <div className="animate-reveal-up mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="AI requests"
              value={formatTokens(summary.totalRequests)}
              hint={`Visitor messages, last ${days} days`}
            />
            <StatCard
              label="Token consumption"
              value={formatPercent(summary.consumptionPercent)}
              hint={`${formatTokens(summary.tokensConsumed)} of ${formatTokens(summary.tokensGranted)} allocated`}
            />
            <StatCard
              label="Low-confidence answers"
              value={formatPercent(summary.lowConfidenceRate)}
              hint={`${formatTokens(summary.lowConfidenceCount)} of ${formatTokens(summary.totalCompletions)} replies, last ${days} days`}
            />
            <StatCard
              label="Need attention"
              value={attention}
              hint={
                attention === 0
                  ? "No tenant is close to its limit"
                  : `${summary.tenantsOutOfTokens} out of tokens · ${summary.tenantsNearLimit} near limit`
              }
            />
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Token figures describe each tenant&apos;s current allocation and don&apos;t change with
            the time window.
          </p>

          <Card
            className="animate-reveal-up mt-8 rounded-interactive p-6"
            style={{ animationDelay: "60ms" }}
          >
            <h2 className="text-sm font-semibold text-ink-primary">Token consumption by tenant</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Share of each tenant&apos;s allocation used so far, most-used first
            </p>
            <div className="mt-4">
              {chartPoints.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-muted">
                  No tokens allocated to tenants yet.
                </p>
              ) : (
                <TokenUsageChart data={chartPoints} />
              )}
            </div>
          </Card>

          <Card
            className="animate-reveal-up mt-8 overflow-hidden rounded-interactive"
            style={{ animationDelay: "120ms" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Usage per tenant</caption>
                <thead className="border-b border-subtle bg-surface-raised text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3 text-right">Requests</th>
                    <th className="px-4 py-3 text-right">Low confidence</th>
                    <th className="px-4 py-3 text-right">Blocked by quota</th>
                    <th className="px-4 py-3 text-right">Tokens used</th>
                    <th className="px-4 py-3">Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.map((row) => (
                    <tr
                      key={row.tenant_id}
                      className="border-b border-subtle transition-colors last:border-0 hover:bg-surface-raised"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink-primary">{row.tenant_name}</p>
                        <p className="font-mono text-xs text-ink-muted">{row.tenant_slug}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink-primary">
                        {formatTokens(row.rag_requests)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink-primary">
                        {formatTokens(row.low_confidence)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink-primary">
                        {row.quota_exhausted > 0 ? (
                          <span className="text-status-error">{formatTokens(row.quota_exhausted)}</span>
                        ) : (
                          0
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink-primary">
                        {row.quota_granted > 0
                          ? formatPercent(consumptionPercent(row))
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {formatRelativeTime(row.last_activity_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <section className="animate-reveal-up mt-8" style={{ animationDelay: "180ms" }}>
            <h2 className="text-lg font-semibold text-ink-primary">Dev Crew recommendations</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Patterns Dev Crew spotted in your tenants&apos; recent chats.
            </p>
            <div className="mt-4 space-y-3">
              {(recommendations ?? []).length === 0 ? (
                <Card className="rounded-interactive">
                  <EmptyState
                    icon={Lightbulb}
                    title="No recommendations yet"
                    description="Dev Crew reviews chat activity after every conversation and posts here when it finds something worth acting on."
                  />
                </Card>
              ) : (
                (recommendations ?? []).map((entry) => {
                  const metadata = (entry.metadata ?? {}) as DevCrewMetadata;
                  return (
                    <Card key={entry.id} className="rounded-interactive p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="min-w-0 flex-1 text-sm text-ink-primary">
                          {metadata.recommendation ?? "No details available."}
                        </p>
                        {typeof metadata.negative_count === "number" ? (
                          <Badge tone="warn" className="normal-case">
                            {metadata.negative_count} signal{metadata.negative_count === 1 ? "" : "s"}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                        <Badge className="normal-case">
                          {(entry.organization_id && tenantNameById.get(entry.organization_id)) ||
                            "Unknown tenant"}
                        </Badge>
                        {formatRelativeTime(entry.created_at)}
                      </p>
                    </Card>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
