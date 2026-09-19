import { Receipt } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/card";
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
import { formatMoney } from "@/lib/format";
import { requireOperatorAdmin } from "@/lib/operator";
import type { ClientInvoice } from "@/types";

export const dynamic = "force-dynamic";

type PaymentState = "paid" | "pending" | "failed";

/** Groups the five invoice statuses into the three states the operator cares about. */
function paymentState(status: string): PaymentState {
  if (status === "paid") return "paid";
  if (status === "draft" || status === "sent") return "pending";
  return "failed";
}

const STATE_TONE: Record<PaymentState, BadgeTone> = { paid: "success", pending: "warn", failed: "error" };

export default async function AdminPaymentsPage() {
  const { supabase } = await requireOperatorAdmin();
  const [t, locale, format] = await Promise.all([
    getTranslations("admin.payments"),
    getLocale(),
    getFormatter(),
  ]);

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
  const sumBy = (predicate: (invoice: ClientInvoice) => boolean) =>
    rows.filter(predicate).reduce((sum, invoice) => sum + invoice.amount, 0);

  const thisMonthTotal = sumBy((i) => i.status === "paid" && Boolean(i.paid_at) && new Date(i.paid_at as string) >= monthStart);
  const pendingTotal = sumBy((i) => paymentState(i.status) === "pending");
  const failedTotal = sumBy((i) => paymentState(i.status) === "failed");

  return (
    <PageContainer className="max-w-7xl">
      <PageHeader title={t("title")} description={t("description")} />

      <section aria-label={t("title")} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label={t("summary.thisMonth")} value={formatMoney(locale, thisMonthTotal)} />
        <MetricCard label={t("summary.pending")} value={formatMoney(locale, pendingTotal)} />
        <MetricCard label={t("summary.failed")} value={formatMoney(locale, failedTotal)} />
      </section>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Receipt} title={t("emptyTitle")} description={t("emptyDescription")} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.date")}</TableHead>
                  <TableHead>{t("columns.client")}</TableHead>
                  <TableHead>{t("columns.number")}</TableHead>
                  <TableHead>{t("columns.amount")}</TableHead>
                  <TableHead>{t("columns.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((invoice) => {
                  const state = paymentState(invoice.status);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="text-xs text-slate-400">
                        {format.dateTime(new Date(invoice.created_at), { dateStyle: "medium" })}
                      </TableCell>
                      <TableCell className="font-medium text-slate-100">{orgNameById.get(invoice.organization_id) ?? "—"}</TableCell>
                      <TableCell dir="ltr" className="text-start font-mono text-xs text-slate-400">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell dir="ltr" className="text-start font-mono text-slate-100">
                        {formatMoney(locale, invoice.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge tone={STATE_TONE[state]}>{t(`status.${state}`)}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
