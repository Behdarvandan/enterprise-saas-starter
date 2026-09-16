"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LeadStatus } from "@/types";

const STATUS_OPTIONS: LeadStatus[] = [
  "new",
  "contacted",
  "quoted",
  "accepted",
  "rejected",
];

interface LeadActionsProps {
  leadId: string;
  status: LeadStatus;
  convertedOrganizationId: string | null;
}

export default function LeadActions({
  leadId,
  status,
  convertedOrganizationId,
}: LeadActionsProps) {
  const router = useRouter();
  const [statusLoading, setStatusLoading] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(nextStatus: LeadStatus) {
    setStatusLoading(true);
    setError(null);

    const response = await fetch(`/api/admin/leads/${leadId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    }).catch(() => null);

    if (!response || !response.ok) {
      setError("Failed to update the status.");
    }

    setStatusLoading(false);
    router.refresh();
  }

  async function handleConvert() {
    if (
      !window.confirm(
        "Convert this lead into a client organization and send an invitation email?",
      )
    ) {
      return;
    }

    setConvertLoading(true);
    setError(null);

    const response = await fetch(`/api/admin/leads/${leadId}/convert`, {
      method: "POST",
    }).catch(() => null);

    if (!response) {
      setError("Something went wrong.");
      setConvertLoading(false);
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      setError(data.error ?? "Failed to convert the lead.");
      setConvertLoading(false);
      return;
    }

    setConvertLoading(false);
    router.refresh();
  }

  if (convertedOrganizationId) {
    return (
      <div className="flex items-center gap-2 rounded-control border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm font-medium text-status-success">
        <CheckCircle2 size={16} />
        Converted to a client organization.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Status
      </label>
      <select
        value={status}
        disabled={statusLoading}
        onChange={(event) => handleStatusChange(event.target.value as LeadStatus)}
        className="rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-violet-dim"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <Button type="button" onClick={handleConvert} disabled={convertLoading}>
        {convertLoading ? "Converting..." : "Convert to client"}
        <ArrowUpRight size={16} />
      </Button>

      {error && <p className="w-full text-xs font-medium text-status-error">{error}</p>}
    </div>
  );
}
