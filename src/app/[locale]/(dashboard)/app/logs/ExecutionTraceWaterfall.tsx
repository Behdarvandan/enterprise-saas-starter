"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent } from "@/core/ui/primitives/card";

export interface ExecutionTraceSpan {
  id: string;
  name: "embeddingGeneration" | "vectorSearch" | "llmTokenStream";
  startOffsetMs: number;
  durationMs: number;
  detail: string;
}

export interface ExecutionTraceWaterfallCopy {
  spanLabels: Record<ExecutionTraceSpan["name"], string>;
  totalDurationLabel: string;
  expandLabel: string;
  collapseLabel: string;
}

/** No accordion primitive exists in this codebase — expand/collapse follows the established Card + local-state + chevron pattern. */
export default function ExecutionTraceWaterfall({
  spans,
  copy,
}: {
  spans: ExecutionTraceSpan[];
  copy: ExecutionTraceWaterfallCopy;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const totalDurationMs = spans.reduce((max, span) => Math.max(max, span.startOffsetMs + span.durationMs), 0);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        {copy.totalDurationLabel}: {totalDurationMs} ms
      </p>
      {spans.map((span) => {
        const isExpanded = expandedId === span.id;
        const widthPct = totalDurationMs > 0 ? (span.durationMs / totalDurationMs) * 100 : 0;
        const offsetPct = totalDurationMs > 0 ? (span.startOffsetMs / totalDurationMs) * 100 : 0;
        return (
          <Card key={span.id} variant="item">
            <CardContent className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{copy.spanLabels[span.name]}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{span.durationMs} ms</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => setExpandedId(isExpanded ? null : span.id)}
                    aria-label={isExpanded ? copy.collapseLabel : copy.expandLabel}
                  >
                    <span className="t-icon-swap" data-state={isExpanded ? "b" : "a"}>
                      <ChevronDown className="t-icon size-4" data-icon="a" aria-hidden />
                      <ChevronUp className="t-icon size-4" data-icon="b" aria-hidden />
                    </span>
                  </Button>
                </div>
              </div>
              <div className="relative h-2 w-full rounded-full bg-muted">
                <div
                  className="absolute h-full rounded-full bg-primary"
                  style={{ insetInlineStart: `${offsetPct}%`, width: `${widthPct}%` }}
                />
              </div>
              <div
                className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out"
                style={isExpanded ? { gridTemplateRows: "1fr" } : undefined}
              >
                <div className="overflow-hidden">
                  <p className="text-xs text-muted-foreground">{span.detail}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
