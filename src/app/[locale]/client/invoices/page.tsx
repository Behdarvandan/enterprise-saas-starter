import { Download, FileText, Receipt } from "lucide-react";
import { requireMembership } from "@/lib/auth";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import type { ClientProject, InvoiceStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<InvoiceStatus, "success" | "warn" | "error" | "neutral"> = {
  draft: "neutral",
  sent: "warn",
  paid: "success",
  overdue: "error",
  void: "neutral",
};

export default async function ClientInvoicesPage() {
  const { supabase, membership } = await requireMembership();

  const { data: invoices } = await supabase
    .from("client_invoices")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .order("created_at", { ascending: false });

  const projectIds = Array.from(
    new Set(
      (invoices ?? [])
        .map((invoice) => invoice.project_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const { data: projects } = projectIds.length
    ? await supabase
        .from("client_projects")
        .select("id, repo_url, live_url")
        .in("id", projectIds)
    : { data: [] as Pick<ClientProject, "id" | "repo_url" | "live_url">[] };

  const projectById = new Map((projects ?? []).map((project) => [project.id, project]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-ink-primary">Invoices</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Download your invoices and access delivery links.
      </p>

      {!invoices || invoices.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Receipt}
            title="No invoices yet"
            description="Invoices will appear here once one is issued."
          />
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-interactive border border-subtle bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-subtle bg-surface-raised text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due date</th>
                <th className="px-4 py-3 text-right">Links</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const project = invoice.project_id
                  ? projectById.get(invoice.project_id)
                  : undefined;

                return (
                  <tr key={invoice.id} className="border-b border-subtle last:border-0">
                    <td className="px-4 py-3 font-mono text-ink-primary">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink-primary">
                      {(invoice.amount / 100).toLocaleString(undefined, {
                        style: "currency",
                        currency: invoice.currency.toUpperCase(),
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[invoice.status as InvoiceStatus]}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{invoice.due_date ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-3">
                        <a
                          href={`/api/client/invoices/${invoice.id}/pdf`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-violet-dim hover:text-violet"
                        >
                          <Download size={14} /> PDF
                        </a>
                        {invoice.contract_url && (
                          <a
                            href={invoice.contract_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-violet-dim hover:text-violet"
                          >
                            <FileText size={14} /> Contract
                          </a>
                        )}
                        {project?.repo_url && (
                          <a
                            href={project.repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-violet-dim hover:text-violet"
                          >
                            Repo
                          </a>
                        )}
                        {project?.live_url && (
                          <a
                            href={project.live_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-violet-dim hover:text-violet"
                          >
                            Live
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
