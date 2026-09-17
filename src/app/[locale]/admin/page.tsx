import { AlertTriangle, CalendarClock, TrendingDown, UserPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireOperatorAdmin, getOperatorOrganizationId } from "@/lib/operator";
import { formatPrice } from "@/lib/utils";
import FreelanceRevenueChart, {
  type MonthlyRevenuePoint,
} from "@/components/admin/FreelanceRevenueChart";
import CountUp from "@/components/ui/CountUp";

export const dynamic = "force-dynamic";

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
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
  risk: "border-l-status-error",
  urgent: "border-l-status-warn",
  info: "border-l-subtle",
};

export default async function AdminDashboardPage() {
  const { supabase } = await requireOperatorAdmin();
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

  const kpis: { label: string; value: number; format?: (value: number) => string }[] = [
    { label: "Bu Ay Tahsilat", value: collectedThisMonth, format: formatPrice },
    { label: "Aktif Müşteri", value: activeClients ?? 0 },
    { label: "Bekleyen Lead", value: pendingLeads ?? 0 },
    { label: "Bekleyen Randevu", value: pendingAppointments ?? 0 },
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

  // --- Aksiyon Gerekiyor (priority order per brief §5.1) --------------------
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
      label: `Gecikmiş ödeme — ${orgNameById.get(invoice.organization_id) ?? "Müşteri"}`,
      detail: `${invoice.invoice_number} · ${formatPrice(invoice.amount)}`,
      href: "/admin/payments",
    })),
    ...(hotLeads ?? []).map((lead) => ({
      id: `hot-lead-${lead.id}`,
      severity: "urgent" as const,
      label: `Yeni lead — ${lead.full_name}`,
      detail: "Son 24 saat içinde geldi, henüz yanıtlanmadı",
      href: `/admin/leads/${lead.id}`,
    })),
    ...(upcomingAppointments ?? []).map((appointment) => ({
      id: `appointment-${appointment.id}`,
      severity: "urgent" as const,
      label: `Onay bekleyen randevu — ${appointment.customer_name}`,
      detail: new Date(appointment.start_time).toLocaleString(),
      href: "/admin/appointments",
    })),
    ...(atRiskOrgs ?? []).map((org) => ({
      id: `org-${org.id}`,
      severity: "urgent" as const,
      label: `Abonelik riski — ${org.name}`,
      detail: org.subscription_status === "canceled" ? "İptal edildi" : "Ödeme gecikti",
      href: "/admin/payments",
    })),
    ...(coldLeads ?? []).map((lead) => ({
      id: `cold-lead-${lead.id}`,
      severity: "info" as const,
      label: `Soğuyan lead — ${lead.full_name}`,
      detail: "48 saatten uzun süredir yanıt bekliyor",
      href: `/admin/leads/${lead.id}`,
    })),
  ];

  // --- Activity feed ---------------------------------------------------------
  const { data: recentAudit } = await supabase
    .from("audit_logs")
    .select("id, action, created_at, target_table")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-semibold text-ink-primary">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-muted">
        İşletmenizin genel durumu — gelir, lead&apos;ler ve bekleyen işler tek bakışta.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <div
            key={kpi.label}
            className="animate-reveal-up rounded-interactive border border-subtle bg-surface p-5 transition-[transform,box-shadow,border-color] duration-200 hover:scale-[1.01] hover:border-gold/50 hover:shadow-md hover:shadow-gold/10"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {kpi.label}
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-ink-primary">
              <CountUp value={kpi.value} format={kpi.format} />
            </p>
          </div>
        ))}
      </div>

      <div
        className="animate-reveal-up mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3"
        style={{ animationDelay: "120ms" }}
      >
        <div className="rounded-interactive border border-subtle bg-surface p-6 transition-[box-shadow,border-color] duration-200 hover:border-gold/50 hover:shadow-md hover:shadow-gold/10 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-ink-primary">Gelir eğilimi</h2>
            <span className="font-mono text-lg font-semibold text-ink-primary">
              {formatPrice(revenuePoints.reduce((sum, p) => sum + p.amount * 100, 0))}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">Son {MONTHS_BACK} ay, tahsil edilen ödemeler</p>
          <div className="mt-4">
            <FreelanceRevenueChart data={revenuePoints} />
          </div>
        </div>

        <div className="rounded-interactive border border-subtle bg-surface">
          <div className="border-b border-subtle px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-primary">
              <AlertTriangle size={15} className="text-status-warn" />
              Aksiyon Gerekiyor
            </h2>
          </div>
          <div className="flex flex-col divide-y divide-subtle">
            {actionItems.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-ink-muted">
                Şu an bekleyen bir aksiyon yok.
              </p>
            )}
            {actionItems.slice(0, 8).map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`border-l-2 px-4 py-3 transition-colors hover:bg-surface-raised ${SEVERITY_BORDER[item.severity]}`}
              >
                <p className="text-sm font-medium text-ink-primary">{item.label}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{item.detail}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div
        className="animate-reveal-up mt-8 rounded-interactive border border-subtle bg-surface"
        style={{ animationDelay: "180ms" }}
      >
        <div className="border-b border-subtle px-5 py-4">
          <h2 className="text-sm font-semibold text-ink-primary">Aktivite akışı</h2>
        </div>
        <div className="flex flex-col divide-y divide-subtle">
          {(recentAudit ?? []).length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-ink-muted">Henüz aktivite yok.</p>
          )}
          {(recentAudit ?? []).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2.5">
                {entry.action.startsWith("lead.") ? (
                  <UserPlus size={14} className="text-ink-muted" />
                ) : entry.action.includes("cancel") ? (
                  <TrendingDown size={14} className="text-ink-muted" />
                ) : (
                  <CalendarClock size={14} className="text-ink-muted" />
                )}
                <span className="text-sm text-ink-primary">{entry.action}</span>
                {entry.target_table && (
                  <span className="text-xs text-ink-muted">· {entry.target_table}</span>
                )}
              </div>
              <span className="font-mono text-xs text-ink-muted">
                {new Date(entry.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
