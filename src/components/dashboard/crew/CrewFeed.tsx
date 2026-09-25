"use client";

import { Lightbulb, RefreshCw } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import CrewInsightCard from "@/components/dashboard/crew/CrewInsightCard";
import { useCrewFeed, type FeedConnection } from "@/components/dashboard/crew/useCrewFeed";
import { Button } from "@/core/ui/primitives/button";
import { LiquidCard } from "@/components/ui/liquid/LiquidCard";
import EmptyState from "@/components/ui/EmptyState";
import LiveDot from "@/components/ui/LiveDot";
import MetricCard from "@/components/ui/MetricCard";
import { Tabs, TabsList, TabsTrigger } from "@/core/ui/primitives/tabs";
import { collapseInsights, deriveSeverity } from "@/lib/dev-crew/recommendation";
import { formatMetricNumber } from "@/lib/format";
import type { CrewInsight, CrewSeverity } from "@/types";

type Filter = "all" | CrewSeverity;

const dotTone: Record<FeedConnection, "live" | "idle" | "warn"> = {
  live: "live",
  paused: "idle",
  reconnecting: "warn",
};

interface CrewFeedProps {
  initial: CrewInsight[];
  initialHasMore: boolean;
  /** Server render time (ISO). Relative labels start from it so hydration matches the server HTML. */
  serverTime: string;
}

/** Live telemetry + autonomous recommendation feed from `dev_crew.recommendation` audit rows. */
export default function CrewFeed({ initial, initialHasMore, serverTime }: CrewFeedProps) {
  const t = useTranslations("dashboard.crewInsights");
  const locale = useLocale();
  const format = useFormatter();
  const feed = useCrewFeed(initial, initialHasMore, serverTime);
  const [filter, setFilter] = useState<Filter>("all");

  // Ticking reference time keeps "x minutes ago" labels honest between polls.
  const [now, setNow] = useState(() => new Date(serverTime));
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const collapsed = useMemo(() => collapseInsights(feed.insights), [feed.insights]);
  const counts = useMemo(() => {
    const tally: Record<CrewSeverity, number> = { critical: 0, warning: 0, info: 0 };
    for (const item of collapsed) tally[deriveSeverity(item.negativeCount)] += 1;
    return tally;
  }, [collapsed]);
  const visible = filter === "all" ? collapsed : collapsed.filter((item) => deriveSeverity(item.negativeCount) === filter);

  const connectionLabel = t(`connection.${feed.connection}`);

  return (
    <div className="grid gap-6">
      <section aria-label={t("stats.label")} className="grid gap-4 sm:grid-cols-3">
        <MetricCard label={t("stats.total")} value={formatMetricNumber(locale, collapsed.length)} hint={t("stats.totalHint")} />
        <MetricCard label={t("stats.critical")} value={formatMetricNumber(locale, counts.critical)} />
        <MetricCard label={t("stats.warning")} value={formatMetricNumber(locale, counts.warning)} />
      </section>

      <LiquidCard>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div role="status" className="flex items-center gap-2 text-xs text-foreground">
            <LiveDot tone={dotTone[feed.connection]} />
            <span className="font-medium">{connectionLabel}</span>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <span className="text-muted-foreground">
              {t("updated", { time: format.relativeTime(feed.lastUpdated, now) })}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void feed.refresh()}>
            <RefreshCw aria-hidden />
            {t("refresh")}
          </Button>
        </div>

        <div className="border-b border-border px-5 py-3">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <TabsList>
              <TabsTrigger value="all">{t("filters.all")}</TabsTrigger>
              <TabsTrigger value="critical">
                {t("filters.critical")} <span className="ms-1 font-mono text-xs">{counts.critical}</span>
              </TabsTrigger>
              <TabsTrigger value="warning">
                {t("filters.warning")} <span className="ms-1 font-mono text-xs">{counts.warning}</span>
              </TabsTrigger>
              <TabsTrigger value="info">
                {t("filters.info")} <span className="ms-1 font-mono text-xs">{counts.info}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="mt-2 text-xs text-muted-foreground">{t("derivedNote")}</p>
        </div>

        {collapsed.length === 0 ? (
          <EmptyState icon={Lightbulb} title={t("emptyTitle")} description={t("emptyDescription")} />
        ) : visible.length === 0 ? (
          <EmptyState icon={Lightbulb} title={t("emptyFilteredTitle")} description={t("emptyFilteredDescription")} />
        ) : (
          <ol aria-label={t("title")} className="divide-y divide-border">
            {visible.map((item) => (
              <CrewInsightCard key={item.id} item={item} fresh={feed.freshIds.has(item.id)} now={now} />
            ))}
          </ol>
        )}

        {feed.hasMore ? (
          <div className="border-t border-border p-4 text-center">
            {feed.loadMoreFailed ? (
              <p role="alert" className="mb-2 text-xs text-status-error">
                {t("loadFailed")}
              </p>
            ) : null}
            <Button variant="secondary" size="sm" loading={feed.loadingMore} onClick={() => void feed.loadMore()}>
              {t("loadMore")}
            </Button>
          </div>
        ) : null}
      </LiquidCard>
    </div>
  );
}
