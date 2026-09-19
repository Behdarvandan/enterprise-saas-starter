"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchChunks, RagApiError } from "@/lib/rag/client";
import type { DocumentListItem, IngestChunk } from "@/types";

interface ChunkPreviewSheetProps {
  document: DocumentListItem | null;
  onClose: () => void;
}

/** Side sheet paging through a document's stored chunks — what the agent can actually retrieve. */
export default function ChunkPreviewSheet({ document, onClose }: ChunkPreviewSheetProps) {
  const t = useTranslations("dashboard.knowledgeBase");
  const [chunks, setChunks] = useState<IngestChunk[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const documentId = document?.id ?? null;

  const load = useCallback(
    async (cursor: number, signal?: AbortSignal) => {
      if (!documentId) return;
      setLoading(true);
      setFailed(false);
      try {
        const page = await fetchChunks(documentId, cursor, signal);
        setChunks((current) => (cursor === -1 ? page.chunks : [...current, ...page.chunks]));
        setNextCursor(page.nextCursor);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("[kb] chunk preview failed:", error instanceof RagApiError ? error.code : error);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [documentId],
  );

  useEffect(() => {
    setChunks([]);
    setNextCursor(null);
    if (!documentId) return;
    const controller = new AbortController();
    void load(-1, controller.signal);
    return () => controller.abort();
  }, [documentId, load]);

  return (
    <Sheet open={document !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="end" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("chunks.title", { title: document?.title ?? "" })}</SheetTitle>
          <SheetDescription>{t("chunks.description", { count: document?.chunkCount ?? 0 })}</SheetDescription>
        </SheetHeader>

        <ol className="grid gap-3">
          {chunks.map((chunk) => (
            <li key={chunk.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <p className="text-xs font-medium text-violet-300">
                {t("chunks.chunk", { index: chunk.chunkIndex + 1 })}
                {chunk.tokenCount !== null ? (
                  <span className="ms-2 font-mono text-slate-400">{t("chunks.tokens", { count: chunk.tokenCount })}</span>
                ) : null}
              </p>
              <p className="mt-1.5 text-sm whitespace-pre-wrap text-slate-200">{chunk.content}</p>
            </li>
          ))}
          {loading
            ? Array.from({ length: chunks.length === 0 ? 3 : 1 }, (_, i) => (
                <li key={`sk-${i}`}>
                  <Skeleton className="h-24 rounded-lg" />
                </li>
              ))
            : null}
        </ol>

        {!loading && !failed && chunks.length === 0 ? (
          <p className="text-sm text-slate-400">{t("chunks.empty")}</p>
        ) : null}
        {failed ? (
          <p role="alert" className="text-sm text-status-error">
            {t("chunks.loadFailed")}
          </p>
        ) : null}
        {nextCursor !== null && !loading ? (
          <Button variant="secondary" size="sm" onClick={() => void load(nextCursor)}>
            {t("chunks.loadMore")}
          </Button>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
