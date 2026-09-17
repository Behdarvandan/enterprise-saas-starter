import { requireOperatorAdmin } from "@/lib/operator";
import { formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import CountUp from "@/components/ui/CountUp";
import { Receipt } from "lucide-react";
import type { ClientInvoice, InvoiceStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: "Ödendi",
  draft: "Bekliyor",
  sent: "Bekliyor",
  overdue: "Başarısız",
  void: "Başarısız",
};

const STATUS_TONE: Record<InvoiceStatus, "success" | "warn" | "error"> = {
  paid: "success",
  draft: "warn",
  sent: "warn",
  overdue: "error",
  void: "error",
};

export default async function AdminPaymentsPage() {
  const { supabase } = await requireOperatorAdmin();

  const { data: invoices } = await supabase
    .from("client_invoices")
    .select("id, organization_id, invoice_number, amount, status, due_date, paid_at, created_at")
    .order("created_at", { ascending: false });

  const rows = (invoices ?? []) as ClientInvoice[];

  const orgIds = [...new Set(rows.map((i) => i.organization_id))];
  const { data: organizations } =
    orgIds.length > 0
      ? await supabase.from("organizations").select("id, name").in("id", orgIds)
      : { data: [] };
  const orgNameById = new Map((organizations ?? []).map((o) => [o.id, o.name]));

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthTotal = rows
    .filter((i) => i.status === "paid" && i.paid_at && new Date(i.paid_at) >= monthStart)
    .reduce((sum, i) => sum + i.amount, 0);
  const pendingTotal = rows
    .filter((i) => i.status === "draft" || i.status === "sent")
    .reduce((sum, i) => sum + i.amount, 0);
  const failedTotal = rows
    .filter((i) => i.status === "overdue" || i.status === "void")
    .reduce((sum, i) => sum + i.amount, 0);

  const summary = [
    { label: "Bu Ay Toplam", value: thisMonthTotal },
    { label: "Bekleyen Tutar", value: pendingTotal },
    { label: "Başarısız", value: failedTotal },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-semibold text-ink-primary">Ödemeler</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Tüm müşteri faturaları — freelance/hizmet gelir akışı tek yerde.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summary.map((item, index) => (
          <div
            key={item.label}
            className="animate-reveal-up rounded-interactive border border-subtle bg-surface p-5 transition-[transform,box-shadow,border-color] duration-200 hover:scale-[1.01] hover:border-gold/50 hover:shadow-md hover:shadow-gold/10"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {item.label}
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-ink-primary">
              <CountUp value={item.value} format={formatPrice} />
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-interactive border border-subtle bg-surface">
        {rows.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Henüz fatura yok"
            description="Bir müşteri projesine fatura eklendiğinde burada listelenecek."
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-subtle bg-surface-raised text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Müşteri</th>
                <th className="px-4 py-3">Fatura No</th>
                <th className="px-4 py-3">Tutar</th>
                <th className="px-4 py-3">Durum</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((invoice) => (
                <tr key={invoice.id} className="border-b border-subtle last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink-primary">
                    {orgNameById.get(invoice.organization_id) ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink-primary">
                    {formatPrice(invoice.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[invoice.status as InvoiceStatus]}>
                      {STATUS_LABEL[invoice.status as InvoiceStatus]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
