"use client";

import { Bot, ChevronDown, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import GlassPanel from "@/components/marketing/GlassPanel";
import ThoughtStream from "@/components/marketing/ThoughtStream";
import { useScenarioRun } from "@/components/marketing/useScenarioRun";
import { Button } from "@/core/ui/primitives/button";
import LiveDot from "@/components/ui/LiveDot";
import { SCENARIO_IDS, type ScenarioId } from "@/lib/marketing/scenarios";
import { cn } from "@/lib/utils";

/**
 * Visitor-facing agent playground. Fully scripted — no request leaves the
 * browser — and labelled as a simulation so the sample numbers in the
 * thought stream are never mistaken for live results.
 */
export default function AgentPlayground() {
  const t = useTranslations("marketing.landing.playground");
  const streamId = useId();
  const { scenario, visibleSteps, replyVisible, running, start } = useScenarioRun();
  const [streamOpen, setStreamOpen] = useState(true);

  // Play the first scenario once so the panel is never empty above the fold.
  useEffect(() => {
    const timer = window.setTimeout(() => start(SCENARIO_IDS[0]), 500);
    return () => window.clearTimeout(timer);
  }, [start]);

  const activeId: ScenarioId | null = scenario?.id ?? null;

  return (
    <GlassPanel className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-violet-400">
            <Bot aria-hidden className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold tracking-tight text-slate-100">{t("title")}</h2>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <LiveDot />
              {t("agentName")}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
          {t("simulated")}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div className="min-h-44 space-y-3" aria-live="polite">
          {activeId === null ? (
            <p className="pt-10 text-center text-sm text-slate-400">{t("pickPrompt")}</p>
          ) : (
            <>
              <p className="ms-auto max-w-[85%] rounded-2xl rounded-ee-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                {t(`scenarios.${activeId}.user`)}
              </p>
              {replyVisible ? (
                <p className="animate-reveal-up max-w-[90%] rounded-2xl rounded-es-md border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-200">
                  {t(`scenarios.${activeId}.reply`)}
                </p>
              ) : (
                <p
                  role="status"
                  className="flex w-fit items-center gap-1 rounded-2xl rounded-es-md border border-slate-800 bg-slate-900/80 px-3.5 py-3"
                >
                  <span className="sr-only">{t("thinking")}</span>
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      aria-hidden
                      style={{ animationDelay: `${dot * 150}ms` }}
                      className="size-1.5 animate-pulse rounded-full bg-slate-500"
                    />
                  ))}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label={t("pickPrompt")}>
          {SCENARIO_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={activeId === id}
              disabled={running}
              onClick={() => start(id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-60",
                activeId === id
                  ? "border-primary/60 bg-primary/15 text-slate-100"
                  : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100",
              )}
            >
              {t(`scenarios.${id}.label`)}
            </button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            disabled={running || activeId === null}
            onClick={() => activeId && start(activeId)}
          >
            <RotateCcw aria-hidden />
            {t("replay")}
          </Button>
        </div>

        <div>
          <button
            type="button"
            aria-expanded={streamOpen}
            aria-controls={streamId}
            onClick={() => setStreamOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-300 transition-colors hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            {t("thoughtTitle")}
            <ChevronDown
              aria-hidden
              className={cn("size-4 transition-transform duration-150", streamOpen && "rotate-180")}
            />
          </button>
          <div hidden={!streamOpen} className="mt-2">
            <ThoughtStream id={streamId} scenario={scenario} visibleSteps={visibleSteps} />
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-slate-400">{t("disclaimer")}</p>
      </div>
    </GlassPanel>
  );
}
