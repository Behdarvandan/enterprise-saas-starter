"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowRight, X } from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { Lead, LeadStatus } from "@/types";

const COLUMNS: { key: LeadStatus; label: string }[] = [
  { key: "new", label: "Yeni" },
  { key: "contacted", label: "İletişime Geçildi" },
  { key: "quoted", label: "Teklif Gönderildi" },
  { key: "accepted", label: "Kabul Edildi" },
  { key: "rejected", label: "Reddedildi" },
];

// Linear forward chain — the kanban's "move to next stage" button only
// advances along this path. Rejecting is a separate, always-available
// action (see `handleReject`) rather than part of the forward chain, since
// a lead can be rejected from any stage, not just the one before it.
const NEXT_STATUS: Partial<Record<LeadStatus, LeadStatus>> = {
  new: "contacted",
  contacted: "quoted",
  quoted: "accepted",
};

interface LeadPipelineBoardProps {
  leads: Lead[];
}

export default function LeadPipelineBoard({ leads }: LeadPipelineBoardProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function setStatus(lead: Lead, status: LeadStatus) {
    setPendingId(lead.id);
    await fetch(`/api/admin/leads/${lead.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {COLUMNS.map((column) => {
        const columnLeads = leads.filter((lead) => lead.status === column.key);

        return (
          <div key={column.key} className="rounded-interactive border border-subtle bg-surface">
            <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
              <h2 className="text-sm font-semibold text-ink-primary">{column.label}</h2>
              <span className="rounded-control bg-surface-raised px-2 py-0.5 text-xs font-semibold text-ink-muted">
                {columnLeads.length}
              </span>
            </div>

            <div className="flex flex-col gap-3 p-3">
              {columnLeads.length === 0 && (
                <p className="px-1 py-4 text-center text-xs text-ink-muted">No leads</p>
              )}

              {columnLeads.map((lead) => {
                const nextStatus = NEXT_STATUS[lead.status as LeadStatus];
                const isPending = pendingId === lead.id;
                return (
                  <div
                    key={lead.id}
                    className="rounded-control border border-subtle bg-canvas p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="text-sm font-semibold text-ink-primary hover:text-violet-dim"
                      >
                        {lead.full_name}
                      </Link>
                      <Badge tone={lead.kind === "saas" ? "neutral" : "warn"}>
                        {lead.kind}
                      </Badge>
                    </div>
                    {lead.project_category && (
                      <p className="mt-1 text-xs text-ink-muted">
                        {lead.project_category.replaceAll("_", " ")}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-ink-muted">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {nextStatus && (
                        <button
                          type="button"
                          onClick={() => setStatus(lead, nextStatus)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-violet-dim transition-colors hover:text-violet disabled:opacity-50"
                        >
                          {COLUMNS.find((c) => c.key === nextStatus)?.label}
                          <ArrowRight size={12} />
                        </button>
                      )}
                      {column.key !== "rejected" && column.key !== "accepted" && (
                        <button
                          type="button"
                          onClick={() => setStatus(lead, "rejected")}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-status-error/80 transition-colors hover:text-status-error disabled:opacity-50"
                        >
                          Reddet
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
