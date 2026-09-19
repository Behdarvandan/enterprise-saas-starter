"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { ingestText, RagApiError, uploadFile } from "@/lib/rag/client";
import { validateFile, type FileRejection } from "@/lib/rag/file-types";
import type { RagErrorCode } from "@/lib/rag/schemas";

export type UploadPhase = "queued" | "uploading" | "processing" | "ready" | "failed";

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  phase: UploadPhase;
  /** 0-100 while `uploading`. */
  progress: number;
  error?: RagErrorCode | FileRejection | "network";
}

type Action =
  | { type: "add"; items: UploadItem[] }
  | { type: "update"; id: string; patch: Partial<UploadItem> }
  | { type: "remove"; id: string };

function reducer(state: UploadItem[], action: Action): UploadItem[] {
  switch (action.type) {
    case "add":
      return [...state, ...action.items];
    case "update":
      return state.map((item) => (item.id === action.id ? { ...item, ...action.patch } : item));
    case "remove":
      return state.filter((item) => item.id !== action.id);
  }
}

const MAX_PARALLEL = 2;
/** Finished rows leave the queue after this delay; the document list takes over. */
const READY_LINGER_MS = 2_500;

type Source = { kind: "file"; file: File } | { kind: "text"; title: string; content: string };

/**
 * Upload queue: files (and pasted text) go up at most two at a time, each
 * moving queued → uploading → processing → ready/failed. Failures keep their
 * source so they can be retried without re-picking the file.
 */
export function useUploadQueue(onSettled: () => void) {
  const [items, dispatch] = useReducer(reducer, []);
  const sources = useRef(new Map<string, Source>());
  const running = useRef(new Set<string>());
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const run = useCallback(
    async (id: string) => {
      const source = sources.current.get(id);
      if (!source) return;
      running.current.add(id);
      dispatch({ type: "update", id, patch: { phase: "uploading", progress: 0, error: undefined } });

      let outcome: Partial<UploadItem>;
      try {
        if (source.kind === "file") {
          await uploadFile(source.file, {
            onProgress: (progress) => dispatch({ type: "update", id, patch: { progress } }),
            onProcessing: () => dispatch({ type: "update", id, patch: { phase: "processing", progress: 100 } }),
          });
        } else {
          dispatch({ type: "update", id, patch: { phase: "processing", progress: 100 } });
          await ingestText({ title: source.title, content: source.content });
        }
        sources.current.delete(id);
        outcome = { phase: "ready" };
        setTimeout(() => dispatch({ type: "remove", id }), READY_LINGER_MS);
      } catch (error) {
        outcome = {
          phase: "failed",
          error: error instanceof RagApiError ? error.code : "server_error",
        };
      }

      // Free the slot *before* the final dispatch: that dispatch re-runs the
      // scheduler effect, which must see the slot as available.
      running.current.delete(id);
      dispatch({ type: "update", id, patch: outcome });
      onSettled();
    },
    [onSettled],
  );

  // Start queued items whenever a slot is free.
  useEffect(() => {
    for (const item of items) {
      if (running.current.size >= MAX_PARALLEL) break;
      if (item.phase === "queued" && !running.current.has(item.id)) void run(item.id);
    }
  }, [items, run]);

  const enqueue = useCallback((entries: Source[]): void => {
    const created: UploadItem[] = entries.map((source) => {
      const id = crypto.randomUUID();
      sources.current.set(id, source);
      const name = source.kind === "file" ? source.file.name : source.title;
      const size = source.kind === "file" ? source.file.size : source.content.length;
      const rejection = source.kind === "file" ? validateFile(source.file) : null;
      return rejection
        ? { id, name, size, phase: "failed", progress: 0, error: rejection }
        : { id, name, size, phase: "queued", progress: 0 };
    });
    dispatch({ type: "add", items: created });
  }, []);

  const addFiles = useCallback((files: File[]) => enqueue(files.map((file) => ({ kind: "file", file }))), [enqueue]);
  const addText = useCallback(
    (title: string, content: string) => enqueue([{ kind: "text", title, content }]),
    [enqueue],
  );

  const retry = useCallback((id: string) => {
    const item = itemsRef.current.find((candidate) => candidate.id === id);
    const source = sources.current.get(id);
    if (!item || !source) return;
    // Client-side rejections (type/size) can't succeed on retry.
    if (source.kind === "file" && validateFile(source.file)) return;
    dispatch({ type: "update", id, patch: { phase: "queued", error: undefined } });
  }, []);

  const dismiss = useCallback((id: string) => {
    sources.current.delete(id);
    dispatch({ type: "remove", id });
  }, []);

  return { items, addFiles, addText, retry, dismiss };
}
