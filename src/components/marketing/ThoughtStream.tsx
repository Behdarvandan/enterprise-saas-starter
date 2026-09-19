"use client";

import {
  Brain,
  CalendarCheck,
  Database,
  Flag,
  Gauge,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatMetricNumber } from "@/lib/format";
import {
  isConfident,
  type Scenario,
  type ThoughtStep,
  type ThoughtStepKind,
} from "@/lib/marketing/scenarios";
import { cn } from "@/lib/utils";

interface ThoughtStreamProps {
  scenario: Scenario | null;
  visibleSteps: number;
  /** Also the id the panel toggle points at via `aria-controls`. */
  id: string;
}

// Identifiers as they appear in agent logs — code tokens, not translatable copy.
const STEP_TOKEN: Record<ThoughtStepKind, string> = {
  intent: "intent",
  rag_search: "rag_search",
  retrieval: "retrieval",
  confidence: "confidence",
  tool_call: "tool_call",
  handoff: "dev_crew.flag",
};

const STEP_ICON: Record<ThoughtStepKind, LucideIcon> = {
  intent: Brain,
  rag_search: Search,
  retrieval: Database,
  confidence: Gauge,
  tool_call: CalendarCheck,
  handoff: Flag,
};

export default function ThoughtStream({ scenario, visibleSteps, id }: ThoughtStreamProps) {
  const t = useTranslations("marketing.landing.playground");
  const locale = useLocale();

  const score = (value: number) =>
    formatMetricNumber(locale, value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function detail(scenarioId: Scenario["id"], step: ThoughtStep): string {
    switch (step.kind) {
      case "intent":
        return t(`scenarios.${scenarioId}.intent`);
      case "rag_search":
        return t("thought.ragSearch", { query: t(`scenarios.${scenarioId}.query`) });
      case "retrieval":
        return t("thought.retrieval", { chunks: step.chunks, similarity: score(step.similarity) });
      case "confidence":
        return t(isConfident(step) ? "thought.confidencePass" : "thought.confidenceFail", {
          score: score(step.score),
          threshold: score(step.threshold),
        });
      case "tool_call":
        return t("thought.toolCall", { slot: t("scenarios.booking.slot") });
      case "handoff":
        return t("thought.handoff");
    }
  }

  const steps = scenario?.steps.slice(0, visibleSteps) ?? [];

  return (
    <div id={id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      {scenario === null ? (
        <p className="px-1 py-2 text-xs text-slate-400">{t("thoughtEmpty")}</p>
      ) : (
        <ol aria-live="polite" className="space-y-2">
          {steps.map((step, index) => {
            const Icon = STEP_ICON[step.kind];
            const failed = step.kind === "confidence" && !isConfident(step);
            return (
              <li
                key={`${scenario.id}-${index}`}
                className="animate-reveal-up flex items-start gap-2.5 text-xs"
              >
                <Icon
                  aria-hidden
                  className={cn(
                    "mt-0.5 size-3.5 shrink-0",
                    failed || step.kind === "handoff" ? "text-amber-400" : "text-violet-400",
                  )}
                />
                <p className="min-w-0 text-slate-300">
                  <code dir="ltr" className="me-2 rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[11px] text-violet-400">
                    {STEP_TOKEN[step.kind]}
                  </code>
                  <span
                    className={cn(
                      step.kind === "confidence" && (failed ? "text-amber-400" : "text-emerald-400"),
                    )}
                  >
                    {detail(scenario.id, step)}
                  </span>
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
