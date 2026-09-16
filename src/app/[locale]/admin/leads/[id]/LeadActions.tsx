"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { ArrowUpRight, CheckCircle2, Mail } from "lucide-react";
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
  // Transient, this-session-only: true right after a successful convert
  // call, before the post-creation "send invite?" choice has been made.
  // `convertedOrganizationId` (server data) doesn't reflect the new
  // conversion until the next `router.refresh()`, so this bridges the gap.
  const [justConverted, setJustConverted] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
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
    setJustConverted(true);
  }

  async function handleSendInvite() {
    setInviteStatus("sending");
    setError(null);

    const response = await fetch(`/api/admin/leads/${leadId}/send-invite`, {
      method: "POST",
    }).catch(() => null);

    const data = await response?.json().catch(() => ({}));

    if (!response || !response.ok || data?.error) {
      setInviteStatus("error");
      setError(data?.error ?? "Failed to send the invitation email.");
      return;
    }

    setInviteStatus("sent");
    setJustConverted(false);
    router.refresh();
  }

  function handleSkipInvite() {
    setJustConverted(false);
    router.refresh();
  }

  // Post-creation confirmation (brief §5.3): the client record is already
  // saved at this point either way — this only decides whether to also
  // send the invite email right now.
  if (justConverted) {
    return (
      <div className="rounded-control border border-status-success/30 bg-status-success/10 p-4">
        <p className="text-sm font-medium text-status-success">
          Client oluşturuldu. Davet e-postası gönderilsin mi?
        </p>
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" onClick={handleSendInvite} disabled={inviteStatus === "sending"}>
            {inviteStatus === "sending" ? "Gönderiliyor..." : "Evet"}
          </Button>
          <button
            type="button"
            onClick={handleSkipInvite}
            className="text-sm font-semibold text-ink-muted transition-colors hover:text-ink-primary"
          >
            Şimdi Değil
          </button>
        </div>
        {error && <p className="mt-2 text-xs font-medium text-status-error">{error}</p>}
      </div>
    );
  }

  if (convertedOrganizationId) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-control border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm font-medium text-status-success">
          <CheckCircle2 size={16} />
          Converted to a client organization.
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleSendInvite}
          disabled={inviteStatus === "sending"}
        >
          <Mail size={14} />
          {inviteStatus === "sending"
            ? "Gönderiliyor..."
            : inviteStatus === "sent"
              ? "Daveti Yeniden Gönder"
              : "Daveti Gönder"}
        </Button>
        {inviteStatus === "sent" && (
          <span className="text-xs font-medium text-status-success">Gönderildi</span>
        )}
        {error && <p className="w-full text-xs font-medium text-status-error">{error}</p>}
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
        {convertLoading ? "Converting..." : "Client'a Dönüştür"}
        <ArrowUpRight size={16} />
      </Button>

      {error && <p className="w-full text-xs font-medium text-status-error">{error}</p>}
    </div>
  );
}
