import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import FreelanceRevenueChart, { type MonthlyRevenuePoint } from "@/components/admin/FreelanceRevenueChart";
import SaasRevenueChart, { type PlanRevenuePoint } from "@/components/admin/SaasRevenueChart";
import TokenUsageChart, { type OrgTokenUsagePoint } from "@/components/admin/TokenUsageChart";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Card } from "@/core/ui/primitives/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/primitives/table";
import { formatMoney } from "@/lib/format";
import { requireOperatorAdmin } from "@/lib/operator";
import { getAllPlans, type Plan, type PlanCheckout } from "@/lib/plans";

export const dynamic = "force-dynamic";

const MONTHS_BACK = 6;

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function isStripePlan(plan: Plan): plan is Plan & { checkout: Extract<PlanCheckout, { kind: "stripe" }> } {
  return plan.checkout.kind === "stripe";
}

export default async function AdminAnalyticsPage() {
  const { supabase } = await requireOperatorAdmin();
  const [t, tTiers, locale, format] = await Promise.all([
    getTranslations("admin.analytics"),
    getTranslations("common.tiers"),
    getLocale(),
    getFormatter(),
  ]);

  // --- Freelance revenue: real monthly trend from paid client invoices ----
  const { data: paidInvoices } = await supabase
    .from("client_invoices")
    .select("amount, paid_at, created_at")
    .eq("status", "paid");

  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = MONTHS_BACK - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: monthKey(d),
      label: format.dateTime(d, { month: "short", year: "2-digit", numberingSystem: "latn" }),
    });
  }

  const totalsByMonth = new Map<string, number>(months.map((m) => [m.key, 0]));
  for (const invoice of paidInvoices ?? []) {
    const key = monthKey(new Date(invoice.paid_at ?? invoice.created_at));
    if (totalsByMonth.has(key)) totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + invoice.amount / 100);
  }

  const freelanceRevenue: MonthlyRevenuePoint[] = months.map((m) => ({
    month: m.label,
    amount: Math.round(totalsByMonth.get(m.key) ?? 0),
  }));
  const freelanceTotal = freelanceRevenue.reduce((sum, point) => sum + point.amount, 0);

  // --- SaaS revenue: live MRR snapshot by plan (no local billing-history
  // ledger exists to build a real historical trend from).
  const { data: activeOrganizations } = await supabase
    .from("organizations")
    .select("plan_id")
    .in("subscription_status", ["active", "trialing"]);

  // Only Stripe-checkout plans (EU/Global) are matchable here — PayTR (TR
  // region) activation never sets `organizations.plan_id`, and Enterprise is
  // contact-only with no priceId anywhere. TR MRR isn't recoverable from this
  // table today.
  const saasRevenue: PlanRevenuePoint[] = getAllPlans()
    .filter(isStripePlan)
    .map((plan) => {
      const organizations = (activeOrganizations ?? []).filter(
        (org) => plan.checkout.priceId && org.plan_id === plan.checkout.priceId,
      ).length;
      return {
        plan: `${tTiers(plan.tier)} (${plan.region.toUpperCase()})`,
        amount: organizations * (plan.checkout.amount / 100),
        organizations,
      };
    });
  const saasTotal = saasRevenue.reduce((sum, point) => sum + point.amount, 0);

  // --- Token usage: live per-org quota snapshot, top 10 by usage ------------
  const { data: quotas } = await supabase
    .from("usage_quotas")
    .select("organization_id, tokens_used, tokens_limit")
    .order("tokens_used", { ascending: false })
    .limit(10);

  const quotaOrgIds = (quotas ?? []).map((quota) => quota.organization_id);
  const { data: quotaOrganizations } = quotaOrgIds.length
    ? await supabase.from("organizations").select("id, name").in("id", quotaOrgIds)
    : { data: [] as { id: string; name: string }[] };
  const orgNameById = new Map((quotaOrganizations ?? []).map((org) => [org.id, org.name]));

  const tokenUsage: OrgTokenUsagePoint[] = (quotas ?? []).map((quota) => ({
    organization: orgNameById.get(quota.organization_id) ?? t("tokens.unknown"),
    percentUsed: quota.tokens_limit > 0 ? Math.min(100, (quota.tokens_used / quota.tokens_limit) * 100) : 0,
    tokensUsed: quota.tokens_used,
    tokensLimit: quota.tokens_limit,
  }));

  // --- Audit log -----------------------------------------------------------
  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const actorIds = Array.from(
    new Set((auditLogs ?? []).map((log) => log.actor_id).filter((id): id is string => Boolean(id))),
  );
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, email").in("id", actorIds)
    : { data: [] as { id: string; email: string }[] };
  const actorById = new Map((actors ?? []).map((actor) => [actor.id, actor.email]));

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-slate-100">{t("freelance.title")}</h2>
            <span dir="ltr" className="font-mono text-lg font-semibold tabular-nums text-violet-400">
              {formatMoney(locale, freelanceTotal * 100)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{t("freelance.subtitle", { months: MONTHS_BACK })}</p>
          <div className="mt-4">
            <FreelanceRevenueChart data={freelanceRevenue} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-slate-100">{t("saas.title")}</h2>
            <span dir="ltr" className="font-mono text-lg font-semibold tabular-nums text-violet-400">
              {formatMoney(locale, saasTotal * 100)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{t("saas.subtitle")}</p>
          <div className="mt-4">
            <SaasRevenueChart data={saasRevenue} />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold tracking-tight text-slate-100">{t("tokens.title")}</h2>
        <p className="mt-1 text-xs text-slate-400">{t("tokens.subtitle")}</p>
        <div className="mt-4">
          {tokenUsage.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">{t("tokens.empty")}</p>
          ) : (
            <TokenUsageChart data={tokenUsage} />
          )}
        </div>
      </Card>

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-slate-100">{t("audit.title")}</h2>
        <Card className="mt-4 overflow-hidden">
          {!auditLogs || auditLogs.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">{t("audit.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("audit.action")}</TableHead>
                    <TableHead>{t("audit.actor")}</TableHead>
                    <TableHead>{t("audit.target")}</TableHead>
                    <TableHead>{t("audit.when")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell dir="ltr" className="text-start font-mono text-xs text-slate-100">
                        {log.action}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {log.actor_id ? (actorById.get(log.actor_id) ?? log.actor_id) : t("audit.system")}
                      </TableCell>
                      <TableCell dir="ltr" className="text-start font-mono text-xs text-slate-400">
                        {log.target_table ?? "—"}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {format.dateTime(new Date(log.created_at), { dateStyle: "medium", timeStyle: "short", numberingSystem: "latn" })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </section>
    </PageContainer>
  );
}
