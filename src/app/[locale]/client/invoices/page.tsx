import { Download, FileText, Receipt } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/core/ui/primitives/card";
import EmptyState from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/primitives/table";
import { requireMembership } from "@/lib/auth";
import type { ClientProject } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<KnownInvoiceStatus, BadgeTone> = {
  draft: "neutral",
  sent: "warn",
  paid: "success",
  overdue: "error",
  void: "neutral",
};

const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "void"] as const;
type KnownInvoiceStatus = (typeof INVOICE_STATUSES)[number];

function asInvoiceStatus(value: string): KnownInvoiceStatus | null {
  return (INVOICE_STATUSES as readonly string[]).includes(value) ? (value as KnownInvoiceStatus) : null;
}

const linkClass = "inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover";

export default async function ClientInvoicesPage() {
  const { supabase, membership } = await requireMembership();
  const [t, tNav, locale, format] = await Promise.all([
    getTranslations("client.invoices"),
    getTranslations("client.nav"),
    getLocale(),
    getFormatter(),
  ]);

  const { data: invoices } = await supabase
    .from("client_invoices")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .order("created_at", { ascending: false });

  const projectIds = Array.from(
    new Set((invoices ?? []).map((invoice) => invoice.project_id).filter((id): id is string => Boolean(id))),
  );

  const { data: projects } = projectIds.length
    ? await supabase.from("client_projects").select("id, repo_url, live_url").in("id", projectIds)
    : { data: [] as Pick<ClientProject, "id" | "repo_url" | "live_url">[] };

  const projectById = new Map((projects ?? []).map((project) => [project.id, project]));

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader title={tNav("payments")} description={t("description")} />

      {!invoices || invoices.length === 0 ? (
        <EmptyState icon={Receipt} title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <caption className="sr-only">{t("caption")}</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.invoice")}</TableHead>
                  <TableHead>{t("columns.amount")}</TableHead>
                  <TableHead>{t("columns.status")}</TableHead>
                  <TableHead>{t("columns.due")}</TableHead>
                  <TableHead className="text-end">{t("columns.links")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const project = invoice.project_id ? projectById.get(invoice.project_id) : undefined;
                  const status = asInvoiceStatus(invoice.status);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell dir="ltr" className="text-start font-mono text-slate-100">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell dir="ltr" className="text-start font-mono text-slate-100">
                        {new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: invoice.currency.toUpperCase(),
                          numberingSystem: "latn",
                        }).format(invoice.amount / 100)}
                      </TableCell>
                      <TableCell>
                        <Badge tone={status ? STATUS_TONE[status] : "neutral"}>
                          {status ? t(`status.${status}`) : invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {invoice.due_date
                          ? format.dateTime(new Date(`${invoice.due_date}T00:00:00Z`), { dateStyle: "medium" })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-3">
                          <a href={`/api/client/invoices/${invoice.id}/pdf`} className={linkClass}>
                            <Download aria-hidden size={14} /> {t("pdf")}
                          </a>
                          {invoice.contract_url ? (
                            <a href={invoice.contract_url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                              <FileText aria-hidden size={14} /> {t("contract")}
                            </a>
                          ) : null}
                          {project?.repo_url ? (
                            <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                              {t("repo")}
                            </a>
                          ) : null}
                          {project?.live_url ? (
                            <a href={project.live_url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                              {t("live")}
                            </a>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}
