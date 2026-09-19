"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CrewInsight } from "@/types";

const POLL_MS = 15_000;
const MAX_BACKOFF_MS = 120_000;
/** How long a freshly arrived entry keeps its highlight. */
const FRESH_MS = 6_000;

export type FeedConnection = "live" | "paused" | "reconnecting";

interface FeedResponse {
  insights: CrewInsight[];
  hasMore: boolean;
}

async function request(params: Record<string, string>, signal?: AbortSignal): Promise<FeedResponse> {
  const response = await fetch(`/api/crew-insights?${new URLSearchParams(params).toString()}`, { signal });
  if (!response.ok) throw new Error(`Crew insights request failed (${response.status})`);
  return (await response.json()) as FeedResponse;
}

/**
 * Live Dev Crew feed. There is no Realtime publication for `audit_logs`, so
 * this polls `?since=<newest>` — cheap (usually an empty page), paused while
 * the tab is hidden, and backing off exponentially while the API is failing.
 */
export function useCrewFeed(initial: CrewInsight[], initialHasMore: boolean, serverTime: string) {
  const [insights, setInsights] = useState(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [connection, setConnection] = useState<FeedConnection>("live");
  // Seeded from the server clock so the first client render matches the server HTML.
  const [lastUpdated, setLastUpdated] = useState(() => new Date(serverTime));
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(new Set());
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);

  const newestRef = useRef(initial[0]?.createdAt);
  const failuresRef = useRef(0);
  const inFlightRef = useRef(false);

  useEffect(() => {
    newestRef.current = insights[0]?.createdAt;
  }, [insights]);

  const poll = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const params: Record<string, string> = newestRef.current ? { since: newestRef.current } : {};
      const { insights: incoming } = await request(params);
      failuresRef.current = 0;
      setConnection("live");
      setLastUpdated(new Date());

      if (incoming.length > 0) {
        setInsights((current) => {
          const known = new Set(current.map((item) => item.id));
          return [...incoming.filter((item) => !known.has(item.id)), ...current];
        });
        const ids = incoming.map((item) => item.id);
        setFreshIds((current) => new Set([...current, ...ids]));
        setTimeout(
          () => setFreshIds((current) => new Set([...current].filter((id) => !ids.includes(id)))),
          FRESH_MS,
        );
      }
    } catch (error) {
      failuresRef.current += 1;
      console.warn("[crew-feed] poll failed:", error);
      setConnection("reconnecting");
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  // Self-rescheduling timer: the delay grows with consecutive failures.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function schedule() {
      const delay = Math.min(POLL_MS * 2 ** failuresRef.current, MAX_BACKOFF_MS);
      timer = setTimeout(async () => {
        await poll();
        if (!cancelled && document.visibilityState === "visible") schedule();
      }, delay);
    }
    function onVisibility() {
      if (document.visibilityState === "visible") {
        setConnection(failuresRef.current > 0 ? "reconnecting" : "live");
        void poll();
        schedule();
      } else {
        if (timer) clearTimeout(timer);
        setConnection("paused");
      }
    }

    if (document.visibilityState === "visible") schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [poll]);

  const loadMore = useCallback(async () => {
    const oldest = insights[insights.length - 1]?.createdAt;
    if (!oldest || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreFailed(false);
    try {
      const page = await request({ before: oldest });
      setInsights((current) => {
        const known = new Set(current.map((item) => item.id));
        return [...current, ...page.insights.filter((item) => !known.has(item.id))];
      });
      setHasMore(page.hasMore);
    } catch (error) {
      console.warn("[crew-feed] load more failed:", error);
      setLoadMoreFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }, [insights, loadingMore]);

  return { insights, hasMore, connection, lastUpdated, freshIds, loadingMore, loadMoreFailed, refresh: poll, loadMore };
}
