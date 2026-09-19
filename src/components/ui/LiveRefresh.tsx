"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

interface LiveRefreshProps {
  /** Milliseconds between server-data refreshes. */
  intervalMs?: number;
}

/**
 * Re-runs the current route's server components on an interval so live
 * metrics stay fresh. Paused while the tab is hidden (no wasted requests),
 * and refreshes once immediately when the tab becomes visible again.
 */
export default function LiveRefresh({ intervalMs = 30_000 }: LiveRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (timer === null) timer = setInterval(() => router.refresh(), intervalMs);
    }
    function stop() {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    }
    function onVisibility() {
      if (document.visibilityState === "visible") {
        router.refresh();
        start();
      } else {
        stop();
      }
    }

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, intervalMs]);

  return null;
}
