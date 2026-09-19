"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatMetricPercent } from "@/lib/format";
import { RagApiError, searchKnowledgeBase } from "@/lib/rag/client";
import type { RagSearchHit } from "@/types";

interface Outcome {
  hits: RagSearchHit[];
  topK: number;
  threshold: number;
}

/** Runs the agent's own retrieval for a question and shows the ranked passages with similarity. */
export default function RetrievalSimulator() {
  const t = useTranslations("dashboard.knowledgeBase");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<RagApiError["code"] | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || pending) return;

    setPending(true);
    setError(null);
    try {
      const { hits, params } = await searchKnowledgeBase(trimmed);
      setOutcome({ hits, topK: params.topK, threshold: params.threshold });
    } catch (caught) {
      setOutcome(null);
      setError(caught instanceof RagApiError ? caught.code : "server_error");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("simulator.title")}</CardTitle>
        <CardDescription>{t("simulator.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("simulator.placeholder")}
            aria-label={t("simulator.placeholder")}
            maxLength={500}
          />
          <Button type="submit" loading={pending} disabled={query.trim().length === 0}>
            {pending ? null : <Search aria-hidden />}
            {t("simulator.run")}
          </Button>
        </form>

        {error ? (
          <p role="alert" className="text-sm text-status-error">
            {t(`errors.${error}`)}
          </p>
        ) : null}

        {outcome ? (
          <div aria-live="polite" className="grid gap-3">
            <p className="text-xs text-slate-400">
              {outcome.hits.length === 0
                ? t("simulator.none", { threshold: formatMetricPercent(locale, outcome.threshold * 100) })
                : t("simulator.summary", {
                    count: outcome.hits.length,
                    threshold: formatMetricPercent(locale, outcome.threshold * 100),
                    topK: outcome.topK,
                  })}
            </p>
            <ol className="grid gap-2">
              {outcome.hits.map((hit, index) => (
                <li key={hit.chunkId} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-xs font-medium text-slate-300">
                      {index + 1}. {hit.documentTitle || t("simulator.untitled")} · {t("chunks.chunk", { index: hit.chunkIndex + 1 })}
                    </p>
                    <p dir="ltr" className="shrink-0 font-mono text-sm font-semibold text-violet-400">
                      {formatMetricPercent(locale, hit.similarity * 100)}
                    </p>
                  </div>
                  <Progress value={hit.similarity * 100} className="mt-2 h-1" aria-label={t("simulator.similarity")} />
                  <p className="mt-2 line-clamp-4 text-sm whitespace-pre-wrap text-slate-200">{hit.content}</p>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
