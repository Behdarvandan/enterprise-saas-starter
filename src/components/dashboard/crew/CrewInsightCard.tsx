"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import {
  deriveSeverity,
  parseRecommendation,
  type CollapsedInsight,
} from "@/lib/dev-crew/recommendation";
import { cn } from "@/lib/utils";
import type { CrewSeverity } from "@/types";

const severityTone: Record<CrewSeverity, BadgeTone> = {
  critical: "error",
  warning: "warn",
  info: "neutral",
};

interface CrewInsightCardProps {
  item: CollapsedInsight;
  /** Highlights an entry that just arrived. */
  fresh?: boolean;
  /** Reference time for the relative label; shared so a whole list ticks together. */
  now: Date;
  /** Shown as a badge when the feed spans several tenants (agency analytics). */
  tenantName?: string;
}

/** One Dev Crew recommendation: severity, signal count, structured advice, or raw text as a fallback. */
export default function CrewInsightCard({ item, fresh = false, now, tenantName }: CrewInsightCardProps) {
  const t = useTranslations("dashboard.crewInsights");
  const format = useFormatter();
  const severity = deriveSeverity(item.negativeCount);
  const parsed = useMemo(() => parseRecommendation(item.recommendation), [item.recommendation]);
  const created = new Date(item.createdAt);

  return (
    <li
      className={cn(
        "px-5 py-4 transition-colors duration-700",
        fresh && "animate-reveal-up bg-primary/5 ring-1 ring-inset ring-primary/30",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={severityTone[severity]}>{t(`severity.${severity}`)}</Badge>
        <span className="text-xs text-foreground">{t("card.signals", { count: item.negativeCount })}</span>
        {tenantName ? <Badge>{tenantName}</Badge> : null}
        {item.repeats > 1 ? <Badge tone="violet">{t("card.repeated", { count: item.repeats })}</Badge> : null}
        {fresh ? <Badge tone="success">{t("card.new")}</Badge> : null}
        <time
          dateTime={item.createdAt}
          title={format.dateTime(created, { dateStyle: "medium", timeStyle: "medium" })}
          className="ms-auto text-xs text-muted-foreground"
        >
          {format.relativeTime(created, now)}
        </time>
      </div>

      {parsed.advice ? (
        <div className="mt-3 grid gap-3">
          <p className="text-sm text-foreground">{parsed.advice}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <NameCounts label={t("card.actions")} entries={parsed.actions} />
            <NameCounts label={t("card.resources")} entries={parsed.resources} />
          </div>
          {parsed.analyzed !== null ? (
            <p className="text-xs text-muted-foreground">{t("card.analyzed", { count: parsed.analyzed })}</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm whitespace-pre-wrap text-foreground">{parsed.raw || t("card.noText")}</p>
      )}
    </li>
  );
}

function NameCounts({ label, entries }: { label: string; entries: { name: string; count: number }[] }) {
  if (entries.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {entries.map((entry) => (
          <li
            key={entry.name}
            dir="ltr"
            className="rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs text-primary"
          >
            {entry.name} <span className="text-muted-foreground">×{entry.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
