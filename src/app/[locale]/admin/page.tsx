import { AlertTriangle, CalendarClock, TrendingDown, UserPlus } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Card } from "@/core/ui/primitives/card";
import MetricCard from "@/components/ui/MetricCard";
import { Link } from "@/i18n/navigation";
import { formatMetricNumber, formatMoney } from "@/lib/format";
import { requireOperatorAdmin, getOperatorOrganizationId } from "@/lib/operator";
import FreelanceRevenueChart, {
  type MonthlyRevenuePoint,
} from "@/components/admin/FreelanceRevenueChart";

export const dynamic = "force-dynamic";

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const MONTHS_BACK = 6;
const HOUR_MS = 60 * 60 * 1000;

type ActionSeverity = "risk" | "urgent" | "info";

interface ActionItem {
  id: string;
  severity: ActionSeverity;
  label: string;
  detail: string;
  href: string;
}

const SEVERITY_BORDER: Record<ActionSeverity, string> = {
  risk: "border-s-red-400",
  urgent: "border-s-amber-500",
  info: "border-s-slate-700",
};

export default async function AdminDashboardPage() {
  const { supabase } = await requireOperatorAdmin();
  const [t, locale, format] = await Promise.all([
    getTranslations("admin.dashboard"),
    getLocale(),
    getFormatter(),
  ]);
  const monthLabel = (date: Date) =>
    format.dateTime(date, { month: "short", year: "2-digit", numberingSystem: "latn" });
  const operatorOrgId = await getOperatorOrganizationId();
  const now = new Date();

  // --- KPI row -------------------------------------------------------------
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { data: paidThisMonth },
    { count: activeClients },
    { count: pendingLeads },
    { count: pendingAppointments },
  ] = await Promise.all([
    supabase
      .from("client_invoices")
      .select("amount")
      .eq("status", "paid")
      .gte("paid_at", monthStart),
    supabase.from("client_projects").select("id", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "contacted", "quoted"]),
    operatorOrgId
      ? supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", operatorOrgId)
          .eq("status", "pending")
      : Promise.resolve({ count: 0 }),
  ]);

  const collectedThisMonth = (paidThisMonth ?? []).reduce(
    (sum, invoice) => sum + invoice.amount,
    0,
  );

  const kpis = [
    { label: t("kpis.collected"), value: formatMoney(locale, collectedThisMonth) },
    { label: t("kpis.activeClients"), value: formatMetricNumber(locale, activeClients ?? 0) },
    { label: t("kpis.pendingLeads"), value: formatMetricNumber(locale, pendingLeads ?? 0) },
    { label: t("kpis.pendingAppointments"), value: formatMetricNumber(locale, pendingAppointments ?? 0) },
  ];

  // --- Revenue trend chart ---------------------------------------------------
  const { data: paidInvoices } = await supabase
    .from("client_invoices")
    .select("amount, paid_at, created_at")
    .eq("status", "paid");

  const months: { key: string; label: string }[] = [];
  for (let i = MONTHS_BACK - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: monthKey(d), label: monthLabel(d) });
  }
  const totalsByMonth = new Map(months.map((m) => [m.key, 0]));
  for (const invoice of paidInvoices ?? []) {
    const key = monthKey(new Date(invoice.paid_at ?? invoice.created_at));
    if (totalsByMonth.has(key)) {
      totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + invoice.amount / 100);
    }
  }
  const revenuePoints: MonthlyRevenuePoint[] = months.map((m) => ({
    month: m.label,
    amount: Math.round(totalsByMonth.get(m.key) ?? 0),
  }));

  // --- Needs action (priority order: overdue → hot leads → appointments → risk → cold leads)
  const in24h = new Date(now.getTime() - 24 * HOUR_MS).toISOString();
  const in48hAgo = new Date(now.getTime() - 48 * HOUR_MS).toISOString();
  const in48hAhead = new Date(now.getTime() + 48 * HOUR_MS).toISOString();

  const [
    { data: overdueInvoices },
    { data: hotLeads },
    { data: upcomingAppointments },
    { data: atRiskOrgs },
    { data: coldLeads },
  ] = await Promise.all([
    supabase
      .from("client_invoices")
      .select("id, invoice_number, amount, organization_id")
      .eq("status", "overdue")
      .limit(3),
    supabase
      .from("leads")
      .select("id, full_name, created_at")
      .eq("status", "new")
      .gte("created_at", in24h)
      .order("created_at", { ascending: false })
      .limit(3),
    operatorOrgId
      ? supabase
          .from("appointments")
          .select("id, customer_name, start_time")
          .eq("organization_id", operatorOrgId)
          .eq("status", "pending")
          .gte("start_time", now.toISOString())
          .lte("start_time", in48hAhead)
          .order("start_time", { ascending: true })
          .limit(3)
      : Promise.resolve({ data: [] }),
    supabase
      .from("organizations")
      .select("id, name, subscription_status, current_period_end")
      .in("subscription_status", ["past_due", "canceled"])
      .limit(3),
    supabase
      .from("leads")
      .select("id, full_name, created_at")
      .eq("status", "new")
      .lt("created_at", in48hAgo)
      .order("created_at", { ascending: true })
      .limit(3),
  ]);

  const orgIds = [...new Set((overdueInvoices ?? []).map((i) => i.organization_id))];
  const { data: invoiceOrgs } =
    orgIds.length > 0
      ? await supabase.from("organizations").select("id, name").in("id", orgIds)
      : { data: [] };
  const orgNameById = new Map((invoiceOrgs ?? []).map((o) => [o.id, o.name]));

  const actionItems: ActionItem[] = [
    ...(overdueInvoices ?? []).map((invoice) => ({
      id: `invoice-${invoice.id}`,
      severity: "risk" as const,
      label: t("actions.overdue", { name: orgNameById.get(invoice.organization_id) ?? t("actions.fallbackClient") }),
      detail: `${invoice.invoice_number} · ${formatMoney(locale, invoice.amount)}`,
      href: "/admin/payments",
    })),
    ...(hotLeads ?? []).map((lead) => ({
      id: `hot-lead-${lead.id}`,
      severity: "urgent" as const,
      label: t("actions.hotLead", { name: lead.full_name }),
      detail: t("actions.hotLeadDetail"),
      href: `/admin/leads/${lead.id}`,
    })),
    ...(upcomingAppointments ?? []).map((appointment) => ({
      id: `appointment-${appointment.id}`,
      severity: "urgent" as const,
      label: t("actions.appointment", { name: appointment.customer_name }),
      detail: format.dateTime(new Date(appointment.start_time), { dateStyle: "medium", timeStyle: "short", numberingSystem: "latn" }),
      href: "/admin/appointments",
    })),
    ...(atRiskOrgs ?? []).map((org) => ({
      id: `org-${org.id}`,
      severity: "urgent" as const,
      label: t("actions.risk", { name: org.name }),
      detail: org.subscription_status === "canceled" ? t("actions.riskCanceled") : t("actions.riskPastDue"),
      href: "/admin/payments",
    })),
    ...(coldLeads ?? []).map((lead) => ({
      id: `cold-lead-${lead.id}`,
      severity: "info" as const,
      label: t("actions.cold", { name: lead.full_name }),
      detail: t("actions.coldDetail"),
      href: `/admin/leads/${lead.id}`,
    })),
  ];

  // --- Activity feed ---------------------------------------------------------
  const { data: recentAudit } = await supabase
    .from("audit_logs")
    .select("id, action, created_at, target_table")
    .order("created_at", { ascending: false })
    .limit(10);

  const revenueTotal = revenuePoints.reduce((sum, p) => sum + p.amount * 100, 0);

  return (
    <PageContainer className="max-w-7xl">
      <PageHeader title={t("title")} description={t("description")} />

      <section aria-label={t("title")} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <MetricCard key={kpi.label} label={kpi.label} value={kpi.value} />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-slate-100">{t("revenue.title")}</h2>
            <span dir="ltr" className="font-mono text-lg font-semibold tabular-nums text-violet-400">
              {formatMoney(locale, revenueTotal)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{t("revenue.subtitle", { months: MONTHS_BACK })}</p>
          <div className="mt-4">
            <FreelanceRevenueChart data={revenuePoints} />
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-100">
              <AlertTriangle aria-hidden size={15} className="text-amber-400" />
              {t("actions.title")}
            </h2>
          </div>
          <div className="flex flex-col divide-y divide-slate-800">
            {actionItems.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">{t("actions.empty")}</p>
            ) : null}
            {actionItems.slice(0, 8).map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`border-s-2 px-4 py-3 transition-colors hover:bg-slate-800/40 focus-visible:bg-slate-800/40 ${SEVERITY_BORDER[item.severity]}`}
              >
                <p className="text-sm font-medium text-slate-100">{item.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{item.detail}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-sm font-semibold tracking-tight text-slate-100">{t("activity.title")}</h2>
        </div>
        <div className="flex flex-col divide-y divide-slate-800">
          {(recentAudit ?? []).length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">{t("activity.empty")}</p>
          ) : null}
          {(recentAudit ?? []).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {entry.action.startsWith("lead.") ? (
                  <UserPlus aria-hidden size={14} className="shrink-0 text-slate-500" />
                ) : entry.action.includes("cancel") ? (
                  <TrendingDown aria-hidden size={14} className="shrink-0 text-slate-500" />
                ) : (
                  <CalendarClock aria-hidden size={14} className="shrink-0 text-slate-500" />
                )}
                <span dir="ltr" className="truncate font-mono text-sm text-slate-100">
                  {entry.action}
                </span>
                {entry.target_table ? (
                  <span dir="ltr" className="truncate font-mono text-xs text-slate-400">
                    · {entry.target_table}
                  </span>
                ) : null}
              </div>
              <span className="shrink-0 text-xs text-slate-400">
                {format.dateTime(new Date(entry.created_at), { dateStyle: "medium", timeStyle: "short", numberingSystem: "latn" })}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}
