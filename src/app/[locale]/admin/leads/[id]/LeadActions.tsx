"use client";

import { ArrowUpRight, CheckCircle2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { useRouter } from "@/i18n/navigation";
import { asLeadStatus, LEAD_STATUSES, type KnownLeadStatus } from "@/lib/admin/enums";

interface LeadActionsProps {
  leadId: string;
  status: KnownLeadStatus;
  convertedOrganizationId: string | null;
}

type ErrorKey = "status" | "convert" | "invite";

export default function LeadActions({ leadId, status, convertedOrganizationId }: LeadActionsProps) {
  const t = useTranslations("admin.leads");
  const tActions = useTranslations("admin.leads.actions");
  const router = useRouter();
  const [statusLoading, setStatusLoading] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  // Transient, this-session-only: true right after a successful convert call,
  // before the "send invite?" choice has been made. `convertedOrganizationId`
  // (server data) doesn't reflect the new conversion until the next
  // `router.refresh()`, so this bridges the gap.
  const [justConverted, setJustConverted] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<ErrorKey | null>(null);

  async function request(url: string, init: RequestInit): Promise<Response | null> {
    return fetch(url, init).catch((networkError: unknown) => {
      console.error("[leads] request failed:", networkError);
      return null;
    });
  }

  async function handleStatusChange(nextStatus: KnownLeadStatus) {
    setStatusLoading(true);
    setError(null);
    const response = await request(`/api/admin/leads/${leadId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!response?.ok) setError("status");
    setStatusLoading(false);
    router.refresh();
  }

  async function handleConvert() {
    setConvertLoading(true);
    setError(null);
    const response = await request(`/api/admin/leads/${leadId}/convert`, { method: "POST" });
    const data: { error?: string } = response ? await response.json().catch(() => ({})) : {};
    setConvertLoading(false);
    if (!response?.ok || data.error) {
      setError("convert");
      return;
    }
    setJustConverted(true);
  }

  async function handleSendInvite() {
    setInviteStatus("sending");
    setError(null);
    const response = await request(`/api/admin/leads/${leadId}/send-invite`, { method: "POST" });
    const data: { error?: string } = response ? await response.json().catch(() => ({})) : {};
    if (!response?.ok || data.error) {
      setInviteStatus("error");
      setError("invite");
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

  const errorText = error ? (
    <p role="alert" className="text-xs font-medium text-status-error">
      {tActions(`errors.${error}`)}
    </p>
  ) : null;

  // The client record is already saved at this point either way — this only
  // decides whether to also send the invite email right now.
  if (justConverted) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
        <p className="text-sm font-medium text-emerald-300">{tActions("askInvite")}</p>
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" onClick={handleSendInvite} loading={inviteStatus === "sending"}>
            {inviteStatus === "sending" ? tActions("sending") : tActions("yes")}
          </Button>
          <button
            type="button"
            onClick={handleSkipInvite}
            className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            {tActions("notNow")}
          </button>
        </div>
        {errorText ? <div className="mt-2">{errorText}</div> : null}
      </div>
    );
  }

  if (convertedOrganizationId) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
          <CheckCircle2 aria-hidden size={16} />
          {tActions("converted")}
        </div>
        <Button type="button" variant="secondary" onClick={handleSendInvite} loading={inviteStatus === "sending"}>
          {inviteStatus === "sending" ? null : <Mail aria-hidden size={14} />}
          {inviteStatus === "sending"
            ? tActions("sending")
            : inviteStatus === "sent"
              ? tActions("resendInvite")
              : tActions("sendInvite")}
        </Button>
        {inviteStatus === "sent" ? <span className="text-xs font-medium text-emerald-300">{tActions("sent")}</span> : null}
        {errorText ? <div className="w-full">{errorText}</div> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor="lead-status" className="text-xs font-medium text-slate-400">
        {tActions("status")}
      </label>
      <NativeSelect
        id="lead-status"
        value={status}
        disabled={statusLoading}
        onChange={(event) => {
          const next = asLeadStatus(event.target.value);
          if (next) void handleStatusChange(next);
        }}
      >
        {LEAD_STATUSES.map((option) => (
          <option key={option} value={option}>
            {t(`status.${option}`)}
          </option>
        ))}
      </NativeSelect>
      <Button type="button" onClick={handleConvert} loading={convertLoading}>
        {convertLoading ? tActions("converting") : tActions("convert")}
        {convertLoading ? null : <ArrowUpRight aria-hidden size={16} />}
      </Button>
      {errorText ? <div className="w-full">{errorText}</div> : null}
    </div>
  );
}
