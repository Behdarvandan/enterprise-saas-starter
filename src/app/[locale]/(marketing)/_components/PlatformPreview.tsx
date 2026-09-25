"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/core/ui/primitives/button";
import { Card } from "@/core/ui/primitives/card";

// Fixed, clearly-labeled sample values for the scripted walkthrough below -
// not a measurement from any real workspace (see the disclaimer in the UI).
const DEMO = {
  chunks: 4,
  similarity: "0.91",
  score: "0.87",
  threshold: "0.70",
  firstTokenMs: 420,
  tokensPerSecond: 38,
  totalTokens: 96,
};

type Phase = "retrieval" | "confidence" | "streaming" | "done";

/** Scripted, disclosed simulation of the platform's real request path (retrieval -> confidence -> SSE stream) - never a live query. */
export function PlatformPreview() {
  const t = useTranslations("marketing.home.preview");
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [answerWordCount, setAnswerWordCount] = useState(0);

  const answerWords = t("answer").split(" ");

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setPhase(null);
    setAnswerWordCount(0);

    if (reduceMotion) {
      setPhase("done");
      setAnswerWordCount(answerWords.length);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const streamStart = 1600;

    timers.push(setTimeout(() => setPhase("retrieval"), 400));
    timers.push(setTimeout(() => setPhase("confidence"), 1000));
    timers.push(setTimeout(() => setPhase("streaming"), streamStart));

    answerWords.forEach((_, index) => {
      timers.push(setTimeout(() => setAnswerWordCount(index + 1), streamStart + index * 90));
    });

    timers.push(setTimeout(() => setPhase("done"), streamStart + answerWords.length * 90 + 200));

    return () => timers.forEach(clearTimeout);
    // Re-runs only when Replay is clicked; `answerWords` is derived from a
    // static translation string and stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  const showRetrieval = phase !== null;
  const showConfidence = phase === "confidence" || phase === "streaming" || phase === "done";
  const showStream = phase === "streaming" || phase === "done";
  const isDone = phase === "done";

  return (
    <section className="mx-auto max-w-4xl px-4 pb-20">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {t("title")}
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">{t("description")}</p>
      </div>

      <Card variant="section" className="overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("queryLabel")}
          </span>
          <p className="mt-1 text-sm font-medium text-foreground">{t("query")}</p>
        </div>

        <div className="flex flex-col gap-2 px-5 py-4 font-mono text-xs sm:text-sm">
          {showRetrieval ? (
            <p className="animate-reveal-up border-s-2 border-primary/40 ps-3 text-muted-foreground">
              {t("retrievalStep", { chunks: DEMO.chunks, similarity: DEMO.similarity })}
            </p>
          ) : null}
          {showConfidence ? (
            <p className="animate-reveal-up border-s-2 border-primary/40 ps-3 text-muted-foreground">
              {t("confidenceStep", { score: DEMO.score, threshold: DEMO.threshold })}
            </p>
          ) : null}
          {showStream ? (
            <p className="animate-reveal-up border-s-2 border-primary ps-3 text-foreground">
              {t("streamStep")}
            </p>
          ) : null}
        </div>

        {showStream ? (
          <div className="min-h-16 border-t border-border px-5 py-4 text-sm text-foreground sm:text-base">
            {answerWords.slice(0, answerWordCount).join(" ")}
            {!isDone ? <span className="animate-pulse text-muted-foreground">▍</span> : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-muted/40 px-5 py-4">
          <div className="flex flex-wrap gap-6">
            <Metric label={t("metricFirstToken")} value={isDone ? `${DEMO.firstTokenMs}ms` : "-"} />
            <Metric
              label={t("metricTokensPerSecond")}
              value={isDone ? `${DEMO.tokensPerSecond}` : "-"}
            />
            <Metric label={t("metricTotalTokens")} value={isDone ? `${DEMO.totalTokens}` : "-"} />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!isDone}
            onClick={() => setRun((value) => value + 1)}
          >
            <RotateCcw aria-hidden className="size-4" />
            {t("replay")}
          </Button>
        </div>
      </Card>

      <p className="mt-3 text-center text-xs text-muted-foreground">{t("disclaimer")}</p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
