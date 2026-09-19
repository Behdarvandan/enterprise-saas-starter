"use client";

import { ArrowRight, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { Card } from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/navigation";
import { asLeadCategory, LEAD_STATUSES, type KnownLeadStatus } from "@/lib/admin/enums";
import type { Lead } from "@/types";

// Linear forward chain — the kanban's "move to next stage" button only
// advances along this path. Rejecting is a separate, always-available action
// rather than part of the chain, since a lead can be rejected from any stage.
const NEXT_STATUS: Partial<Record<KnownLeadStatus, KnownLeadStatus>> = {
  new: "contacted",
  contacted: "quoted",
  quoted: "accepted",
};

interface LeadPipelineBoardProps {
  leads: Lead[];
}

export default function LeadPipelineBoard({ leads }: LeadPipelineBoardProps) {
  const t = useTranslations("admin.leads");
  const format = useFormatter();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function setStatus(lead: Lead, status: KnownLeadStatus) {
    setPendingId(lead.id);
    await fetch(`/api/admin/leads/${lead.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch((error: unknown) => {
      console.error("[leads] status update failed:", error);
      return null;
    });
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {LEAD_STATUSES.map((column) => {
        const columnLeads = leads.filter((lead) => lead.status === column);
        return (
          <Card key={column}>
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold tracking-tight text-slate-100">{t(`status.${column}`)}</h2>
              <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-semibold text-slate-300">
                {columnLeads.length}
              </span>
            </div>
            <div className="flex flex-col gap-3 p-3">
              {columnLeads.length === 0 ? (
                <p className="px-1 py-4 text-center text-xs text-slate-400">{t("noLeads")}</p>
              ) : null}
              {columnLeads.map((lead) => {
                const nextStatus = NEXT_STATUS[column];
                const isPending = pendingId === lead.id;
                const category = asLeadCategory(lead.project_category);
                return (
                  <div
                    key={lead.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 transition-colors hover:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/admin/leads/${lead.id}`} className="text-sm font-semibold text-slate-100 hover:text-violet-300">
                        {lead.full_name}
                      </Link>
                      <Badge tone={lead.kind === "saas" ? "neutral" : "warn"}>
                        {lead.kind === "saas" ? t("kind.saas") : t("kind.freelance")}
                      </Badge>
                    </div>
                    {category ? <p className="mt-1 text-xs text-slate-400">{t(`categories.${category}`)}</p> : null}
                    <p className="mt-1 text-xs text-slate-400">
                      {format.dateTime(new Date(lead.created_at), { dateStyle: "medium" })}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {nextStatus ? (
                        <button
                          type="button"
                          onClick={() => setStatus(lead, nextStatus)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 text-xs font-medium text-violet-300 transition-colors hover:text-violet-200 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50"
                        >
                          {t(`status.${nextStatus}`)}
                          <ArrowRight aria-hidden size={12} className="rtl:rotate-180" />
                        </button>
                      ) : null}
                      {column !== "rejected" && column !== "accepted" ? (
                        <button
                          type="button"
                          onClick={() => setStatus(lead, "rejected")}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 text-xs font-medium text-status-error/80 transition-colors hover:text-status-error focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50"
                        >
                          {t("reject")}
                          <X aria-hidden size={12} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
