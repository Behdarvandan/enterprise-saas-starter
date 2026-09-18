"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, CircleAlert, Clock, RefreshCw } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import type { CnameStatus } from "@/lib/agency/cname";
import { formatDateUtc } from "@/lib/agency/format";
import { parseVerifyResponse, readVerifyError } from "@/lib/agency/verify-response";

interface CnameVerifierProps {
  agencyId: string;
  /** The saved domain, or `null` when none is configured yet. */
  domain: string | null;
  status: CnameStatus;
  verifiedAt: string | null;
  /** The hostname the CNAME record must point at. */
  target: string;
}

const STATUS_TONE = { active: "success", pending: "warn", failed: "error" } as const;

function StatusIcon({ status }: { status: CnameStatus }) {
  if (status === "active") return <CheckCircle2 size={18} className="text-status-success" />;
  if (status === "failed") return <CircleAlert size={18} className="text-status-error" />;
  return <Clock size={18} className="text-status-warn" />;
}

function statusMessage(status: CnameStatus, domain: string, target: string): string {
  switch (status) {
    case "active":
      return `Verified. Visitors on ${domain} see your branding.`;
    case "failed":
      return `${domain} has a CNAME record, but it doesn't point to ${target}. Update it and check again.`;
    default:
      return `We don't see a CNAME record for ${domain} yet. DNS changes can take a few minutes to a few hours to propagate.`;
  }
}

/**
 * Shows the domain's CNAME status and re-checks it on demand via
 * `POST /api/agency/cname/verify` (a live DNS-over-HTTPS lookup). Remount it
 * with a `key` when the saved domain changes so stale state doesn't linger.
 */
export default function CnameVerifier({
  agencyId,
  domain,
  status: initialStatus,
  verifiedAt: initialVerifiedAt,
  target,
}: CnameVerifierProps) {
  const [status, setStatus] = useState<CnameStatus>(initialStatus);
  const [verifiedAt, setVerifiedAt] = useState(initialVerifiedAt);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function verify() {
    setError(undefined);
    startTransition(async () => {
      try {
        const response = await fetch("/api/agency/cname/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agencyId }),
        });
        const body: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          setError(readVerifyError(body, response.status));
          return;
        }
        const result = parseVerifyResponse(body);
        if (!result) {
          setError("Got an unexpected response. Please try again.");
          return;
        }
        setStatus(result.status);
        setVerifiedAt(result.status === "active" ? new Date().toISOString() : null);
      } catch (networkError) {
        console.error("CNAME verification request failed:", networkError);
        setError("Couldn't reach the server. Check your connection and try again.");
      }
    });
  }

  if (!domain) {
    return (
      <p className="text-sm text-ink-muted">
        Save a custom domain above first, then come back here to verify its DNS record.
      </p>
    );
  }

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-medium text-ink-primary">Add this DNS record at your provider</p>
        <div className="mt-2 overflow-x-auto rounded-control border border-subtle">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-subtle bg-surface-raised text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Value</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs text-ink-primary">
              <tr>
                <td className="px-3 py-2">CNAME</td>
                <td className="px-3 py-2">{domain}</td>
                <td className="px-3 py-2">{target}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Using Cloudflare? Set the record to <strong>DNS only</strong> (grey cloud) — a proxied
          record hides the CNAME and can&apos;t be verified.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={verify} disabled={pending}>
          <RefreshCw className={pending ? "animate-spin" : undefined} />
          {pending ? "Checking DNS…" : "Verify DNS"}
        </Button>
        <Badge tone={STATUS_TONE[status]}>{status}</Badge>
      </div>

      <div aria-live="polite" className="grid gap-2">
        <p className="flex items-start gap-2 text-sm text-ink-muted">
          <span className="mt-0.5 shrink-0">
            <StatusIcon status={status} />
          </span>
          <span>{statusMessage(status, domain, target)}</span>
        </p>
        {status === "active" && verifiedAt ? (
          <p className="text-xs text-ink-muted">Last verified {formatDateUtc(verifiedAt)}.</p>
        ) : null}
        {error ? (
          <p role="alert" className="rounded-lg bg-status-error/10 px-3 py-2 text-xs font-medium text-status-error">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
