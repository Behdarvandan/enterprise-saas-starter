"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import LiveDot from "@/components/ui/LiveDot";

type Status = "checking" | "online" | "unreachable";

const HEALTH_TIMEOUT_MS = 5_000;

/**
 * Footer status pill. Reflects one real request to `/api/health` (the web
 * app's own health endpoint), so it says "online" only when that answered —
 * and never claims more than that endpoint checks.
 */
export default function SystemStatus() {
  const t = useTranslations("marketing.landing.footer.status");
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    let active = true;

    fetch("/api/health", { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (active) setStatus(response.ok ? "online" : "unreachable");
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.warn("[status] health check failed:", error);
        setStatus("unreachable");
      })
      .finally(() => clearTimeout(timer));

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const tone = status === "online" ? "live" : status === "unreachable" ? "warn" : "idle";

  return (
    <p
      role="status"
      className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300"
    >
      <LiveDot tone={tone} />
      {t(status)}
    </p>
  );
}
