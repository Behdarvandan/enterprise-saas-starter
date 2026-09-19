"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteDocuments, fetchDocuments, RagApiError } from "@/lib/rag/client";
import type { DocumentListItem } from "@/types";

const POLL_INTERVAL_MS = 3_000;

/**
 * The organization's documents. Polls while any document is still
 * `processing` (so a page reload mid-ingest still resolves to ready/failed)
 * and stops as soon as everything has settled.
 */
export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentListItem[] | null>(null);
  const [loadError, setLoadError] = useState<RagApiError | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setDocuments(await fetchDocuments(controller.signal));
      setLoadError(null);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setLoadError(error instanceof RagApiError ? error : new RagApiError("server_error", 0, String(error)));
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => controllerRef.current?.abort();
  }, [refresh]);

  const hasProcessing = documents?.some((doc) => doc.status === "processing") ?? false;
  useEffect(() => {
    if (!hasProcessing) return;
    const timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hasProcessing, refresh]);

  /**
   * Optimistically removes documents, then reconciles with the server. On
   * failure the list is restored and the error is rethrown for the caller's toast.
   */
  const remove = useCallback(
    async (ids: string[]) => {
      const removed = new Set(ids);
      const snapshot = documents;
      setDocuments((current) => current?.filter((doc) => !removed.has(doc.id)) ?? current);
      try {
        await deleteDocuments(ids);
      } catch (error) {
        setDocuments(snapshot);
        throw error;
      }
    },
    [documents],
  );

  return { documents, loadError, refresh, remove };
}
