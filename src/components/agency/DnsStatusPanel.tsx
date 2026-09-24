"use client";

import { Check, CheckCircle2, CircleAlert, Clock, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import Badge from "@/components/ui/Badge";
import { Button } from "@/core/ui/primitives/button";
import LiveDot from "@/components/ui/LiveDot";
import type { CnameStatus } from "@/lib/agency/cname";
import {
  parseVerifyResponse,
  readVerifyErrorCode,
  type VerifyErrorCode,
} from "@/lib/agency/verify-response";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** Auto-check cadence and ceiling once the user starts watching. */
const WATCH_INTERVAL_MS = 30_000;
const WATCH_MAX_MS = 10 * 60_000;

interface DnsStatusPanelProps {
  agencyId: string;
  /** The saved domain, or `null` when none is configured yet. */
  domain: string | null;
  status: CnameStatus;
  verifiedAt: string | null;
  /** Result of the last persisted check (server-recorded). */
  lastCheckedAt: string | null;
  lastRecords: string[];
  /** The hostname the CNAME record must point at. */
  target: string;
}

const STATUS_TONE = { active: "success", pending: "warn", failed: "error" } as const;

function StatusIcon({ status }: { status: CnameStatus }) {
  if (status === "active") return <CheckCircle2 aria-hidden className="size-5 text-emerald-400" />;
  if (status === "failed") return <CircleAlert aria-hidden className="size-5 text-red-400" />;
  return <Clock aria-hidden className="size-5 text-amber-400" />;
}

/**
 * CNAME monitoring panel: shows the record to create, the live verdict, what
 * DNS currently returns and when it was last checked. A check is a live
 * DNS-over-HTTPS lookup (`POST /api/agency/cname/verify`); "watch" repeats it
 * every 30 s for up to 10 minutes — enough to ride out DNS propagation —
 * and stops itself on success. Remount with a `key` when the domain changes.
 */
export default function DnsStatusPanel({
  agencyId,
  domain,
  status: initialStatus,
  verifiedAt,
  lastCheckedAt: initialCheckedAt,
  lastRecords: initialRecords,
  target,
}: DnsStatusPanelProps) {
  const t = useTranslations("agency.branding.dns");
  const format = useFormatter();

  const [status, setStatus] = useState<CnameStatus>(initialStatus);
  const [records, setRecords] = useState(initialRecords);
  const [checkedAt, setCheckedAt] = useState(initialCheckedAt ?? (initialStatus === "active" ? verifiedAt : null));
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<VerifyErrorCode | null>(null);
  const [watchDeadline, setWatchDeadline] = useState<number | null>(null);
  // Null until mounted: a client-only clock would differ from the server HTML.
  const [now, setNow] = useState<Date | null>(null);
  const [copied, setCopied] = useState<"name" | "value" | null>(null);
  const inFlight = useRef(false);

  const check = useCallback(async () => {
    if (inFlight.current || !domain) return;
    inFlight.current = true;
    setChecking(true);
    setError(null);

    try {
      const response = await fetch("/api/agency/cname/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId }),
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readVerifyErrorCode(body, response.status));
        return;
      }
      const result = parseVerifyResponse(body);
      if (!result) {
        setError("generic");
        return;
      }
      setStatus(result.status);
      setRecords(result.records);
      // Server-recorded time; falls back to the client clock for older responses.
      setCheckedAt(result.checkedAt ?? new Date().toISOString());
      if (result.status === "active") {
        setWatchDeadline(null);
        toast({ tone: "success", title: t("verifiedToast", { domain }) });
      }
    } catch (networkError) {
      console.error("CNAME verification request failed:", networkError);
      setError("generic");
    } finally {
      inFlight.current = false;
      setChecking(false);
    }
  }, [agencyId, domain, t]);

  // Watch mode: re-check on an interval until success, the ceiling, or unmount.
  useEffect(() => {
    if (watchDeadline === null) return;
    const timer = setInterval(() => {
      if (Date.now() >= watchDeadline) {
        setWatchDeadline(null);
        return;
      }
      if (document.visibilityState === "visible") void check();
    }, WATCH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [watchDeadline, check]);

  // Ticking clock for the countdown / relative "last checked" label.
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(timer);
  }, []);

  async function copy(kind: "name" | "value", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1_500);
    } catch (copyError) {
      console.warn("Clipboard unavailable:", copyError);
      toast({ tone: "error", title: t("copyFailed") });
    }
  }

  if (!domain) {
    return <p className="text-sm text-slate-400">{t("noDomain")}</p>;
  }

  const watching = watchDeadline !== null;
  const secondsLeft = watching ? Math.max(0, Math.round((watchDeadline - (now ?? new Date()).getTime()) / 1000)) : 0;
  const hasRecord = records.length > 0;
  // 0 = add the record, 1 = wait for / fix DNS, 2 = verified.
  const step = status === "active" ? 2 : hasRecord ? 1 : 0;

  const steps = [t("steps.add"), t("steps.propagate"), t("steps.verified")];
  const recordRows = [
    { kind: "name" as const, label: t("record.name"), value: domain },
    { kind: "value" as const, label: t("record.value"), value: target },
  ];

  return (
    <div className="grid gap-6">
      <ol aria-label={t("stepsLabel")} className="grid gap-2 sm:grid-cols-3">
        {steps.map((label, index) => {
          const done = index < step || status === "active";
          const current = index === step && status !== "active";
          return (
            <li
              key={label}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm",
                done
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                  : current
                    ? "border-violet-500/40 bg-violet-500/10 text-violet-200"
                    : "border-slate-800 text-slate-400",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  done ? "bg-emerald-500/20" : current ? "bg-violet-500/20" : "bg-slate-800",
                )}
              >
                {done ? <Check className="size-3" /> : index + 1}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      <div>
        <p className="text-sm font-medium text-slate-100">{t("addRecord")}</p>
        <dl className="mt-2 overflow-hidden rounded-lg border border-slate-800">
          <div className="flex items-center gap-3 border-b border-slate-800 bg-slate-900/60 px-3 py-2">
            <dt className="w-16 text-xs font-medium text-slate-400">{t("record.type")}</dt>
            <dd dir="ltr" className="font-mono text-xs text-slate-100">
              CNAME
            </dd>
          </div>
          {recordRows.map((row) => (
            <div key={row.kind} className="flex items-center gap-3 border-b border-slate-800 px-3 py-2 last:border-0">
              <dt className="w-16 shrink-0 text-xs font-medium text-slate-400">{row.label}</dt>
              <dd dir="ltr" className="min-w-0 flex-1 truncate text-start font-mono text-xs text-slate-100">
                {row.value}
              </dd>
              <button
                type="button"
                onClick={() => void copy(row.kind, row.value)}
                aria-label={t("copyAria", { label: row.label })}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                {copied === row.kind ? <Check aria-hidden className="size-4 text-emerald-400" /> : <Copy aria-hidden className="size-4" />}
              </button>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-slate-400">{t("cloudflareHint")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void check()} loading={checking}>
          {checking ? null : <RefreshCw aria-hidden />}
          {checking ? t("checking") : t("verify")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={status === "active"}
          onClick={() => setWatchDeadline(watching ? null : Date.now() + WATCH_MAX_MS)}
        >
          {watching ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          {watching ? t("stopWatching") : t("startWatching")}
        </Button>
        <Badge tone={STATUS_TONE[status]}>{t(`status.${status}`)}</Badge>
        {watching ? (
          <span role="status" className="flex items-center gap-2 text-xs text-slate-300">
            <LiveDot />
            {t("watching", { time: `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}` })}
          </span>
        ) : null}
      </div>

      <div aria-live="polite" className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
        <p className="flex items-start gap-3 text-sm text-slate-300">
          <StatusIcon status={status} />
          <span>{t(`message.${status}`, { domain, target })}</span>
        </p>

        <dl className="grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">{t("dnsReturns")}</dt>
            <dd dir="ltr" className="mt-0.5 text-start font-mono text-slate-100">
              {hasRecord ? records.join(", ") : checkedAt ? t("noRecordFound") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">{t("lastChecked")}</dt>
            <dd className="mt-0.5 text-slate-100">
              {checkedAt ? (
                <>
                  {format.dateTime(new Date(checkedAt), { dateStyle: "medium", timeStyle: "short" })}{" "}
                  {now ? <span className="text-slate-400">({format.relativeTime(new Date(checkedAt), now)})</span> : null}
                </>
              ) : (
                t("neverChecked")
              )}
            </dd>
          </div>
        </dl>

        {error ? (
          <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-medium text-status-error">
            {t(`errors.${error}`)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
