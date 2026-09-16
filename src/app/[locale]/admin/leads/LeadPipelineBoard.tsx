"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { Lead, LeadStatus } from "@/types";

const COLUMNS: { key: LeadStatus; label: string }[] = [
  { key: "new", label: "New" },
  { key: "quoted", label: "Quoted" },
  { key: "accepted", label: "Accepted" },
  { key: "completed", label: "Completed" },
];

const NEXT_STATUS: Partial<Record<LeadStatus, LeadStatus>> = {
  new: "quoted",
  quoted: "accepted",
  accepted: "completed",
};

interface LeadPipelineBoardProps {
  leads: Lead[];
}

export default function LeadPipelineBoard({ leads }: LeadPipelineBoardProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function moveToNextStage(lead: Lead) {
    const nextStatus = NEXT_STATUS[lead.status as LeadStatus];
    if (!nextStatus) return;

    setPendingId(lead.id);
    await fetch(`/api/admin/leads/${lead.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    }).catch(() => null);
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    {lead.company && (
                      <p className="mt-1 text-xs text-ink-muted">{lead.company}</p>
                    )}
                    {lead.budget_range && (
                      <p className="mt-2 font-mono text-xs text-ink-muted">
                        {lead.budget_range}
                      </p>
                    )}

                    {nextStatus && (
                      <button
                        type="button"
                        onClick={() => moveToNextStage(lead)}
                        disabled={pendingId === lead.id}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-dim transition-colors hover:text-violet disabled:opacity-50"
                      >
                        Move to {NEXT_STATUS[lead.status as LeadStatus]}
                        <ArrowRight size={12} />
                      </button>
                    )}
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
