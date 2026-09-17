import { requireOperatorAdmin } from "@/lib/operator";
import { getPlans } from "@/lib/plans";
import CountUp from "@/components/ui/CountUp";
import FreelanceRevenueChart, {
  type MonthlyRevenuePoint,
} from "@/components/admin/FreelanceRevenueChart";
import SaasRevenueChart, {
  type PlanRevenuePoint,
} from "@/components/admin/SaasRevenueChart";
import TokenUsageChart, {
  type OrgTokenUsagePoint,
} from "@/components/admin/TokenUsageChart";

export const dynamic = "force-dynamic";

const MONTHS_BACK = 6;

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function parsePriceToNumber(price: string): number {
  return Number(price.replace(/[^0-9.]/g, "")) || 0;
}

export default async function AdminAnalyticsPage() {
  const { supabase } = await requireOperatorAdmin();

  // --- Freelance revenue: real monthly trend from paid client invoices ----
  const { data: paidInvoices } = await supabase
    .from("client_invoices")
    .select("amount, paid_at, created_at")
    .eq("status", "paid");

  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = MONTHS_BACK - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: monthKey(d), label: monthLabel(d) });
  }

  const totalsByMonth = new Map<string, number>(months.map((m) => [m.key, 0]));
  for (const invoice of paidInvoices ?? []) {
    const bucketDate = new Date(invoice.paid_at ?? invoice.created_at);
    const key = monthKey(bucketDate);
    if (totalsByMonth.has(key)) {
      totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + invoice.amount / 100);
    }
  }

  const freelanceRevenue: MonthlyRevenuePoint[] = months.map((m) => ({
    month: m.label,
    amount: Math.round(totalsByMonth.get(m.key) ?? 0),
  }));
  const freelanceTotal = freelanceRevenue.reduce((sum, point) => sum + point.amount, 0);

  // --- SaaS revenue: live MRR snapshot by plan (no local billing-history --
  // ledger exists to build a real historical trend from — see
  // SaasRevenueChart's doc comment).
  const { data: activeOrganizations } = await supabase
    .from("organizations")
    .select("plan_id")
    .in("subscription_status", ["active", "trialing"]);

  const plans = getPlans();
  const saasRevenue: PlanRevenuePoint[] = plans.map((plan) => {
    const organizations = (activeOrganizations ?? []).filter(
      (org) => plan.priceId && org.plan_id === plan.priceId,
    ).length;
    return {
      plan: plan.name,
      amount: organizations * parsePriceToNumber(plan.price),
      organizations,
    };
  });
  const saasTotal = saasRevenue.reduce((sum, point) => sum + point.amount, 0);

  // --- Token usage: live per-org quota snapshot, top 10 by usage (see -----
  // TokenUsageChart's doc comment for why this isn't a historical trend).
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
    organization: orgNameById.get(quota.organization_id) ?? "Unknown",
    percentUsed:
      quota.tokens_limit > 0
        ? Math.min(100, (quota.tokens_used / quota.tokens_limit) * 100)
        : 0,
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-ink-primary">Revenue analytics</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Freelance and SaaS revenue, tracked separately.
      </p>

      <div className="animate-reveal-up mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-interactive border border-subtle bg-surface p-6 transition-[box-shadow,border-color] duration-200 hover:border-gold/50 hover:shadow-md hover:shadow-gold/10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-ink-primary">Freelance revenue</h2>
            <span className="font-mono text-lg font-semibold text-ink-primary">
              <CountUp value={freelanceTotal} format={(v) => `$${Math.round(v).toLocaleString()}`} />
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">Paid invoices, last {MONTHS_BACK} months</p>
          <div className="mt-4">
            <FreelanceRevenueChart data={freelanceRevenue} />
          </div>
        </div>

        <div className="rounded-interactive border border-subtle bg-surface p-6 transition-[box-shadow,border-color] duration-200 hover:border-gold/50 hover:shadow-md hover:shadow-gold/10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-ink-primary">SaaS revenue</h2>
            <span className="font-mono text-lg font-semibold text-ink-primary">
              <CountUp value={saasTotal} format={(v) => `$${Math.round(v).toLocaleString()}/mo`} />
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">Live MRR by plan, active + trialing orgs</p>
          <div className="mt-4">
            <SaasRevenueChart data={saasRevenue} />
          </div>
        </div>
      </div>

      <div
        className="animate-reveal-up mt-8 rounded-interactive border border-subtle bg-surface p-6 transition-[box-shadow,border-color] duration-200 hover:border-gold/50 hover:shadow-md hover:shadow-gold/10"
        style={{ animationDelay: "60ms" }}
      >
        <h2 className="text-sm font-semibold text-ink-primary">AI assistant token usage</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Current period quota consumption, top 10 organizations by usage
        </p>
        <div className="mt-4">
          {tokenUsage.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              No RAG chat usage recorded yet.
            </p>
          ) : (
            <TokenUsageChart data={tokenUsage} />
          )}
        </div>
      </div>

      <div className="animate-reveal-up mt-8" style={{ animationDelay: "120ms" }}>
        <h2 className="text-lg font-semibold text-ink-primary">Audit log</h2>
        <div className="mt-4 overflow-hidden rounded-interactive border border-subtle bg-surface">
          {!auditLogs || auditLogs.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">
              No audited actions yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-subtle bg-surface-raised text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-subtle transition-colors last:border-0 hover:bg-surface-raised"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-ink-primary">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {log.actor_id ? (actorById.get(log.actor_id) ?? log.actor_id) : "system"}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {log.target_table ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
