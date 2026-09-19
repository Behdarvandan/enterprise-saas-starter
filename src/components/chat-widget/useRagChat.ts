"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatStreamEvent } from "@/types";

export interface ChatMessageView {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Set on synthetic assistant messages; the view supplies the localized text. */
  notice?: "error" | "empty";
}

interface UseRagChatOptions {
  organizationId: string;
  /** Absolute origin of the host application; empty means same-origin. */
  apiBaseUrl?: string;
  /** localStorage key for the session id; distinct keys keep conversations separate. */
  storageKey?: string;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Streaming RAG chat state machine shared by the floating `ChatWidget` and
 * the dashboard's inline `ChatSimulator`. Talks to `POST /api/chat/rag` (SSE:
 * `session` / `delta` events) and restores history via `GET`.
 */
export function useRagChat({ organizationId, apiBaseUrl = "", storageKey }: UseRagChatOptions) {
  const key = storageKey ?? `rag-chat-session:${organizationId}`;
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/api/chat/rag`;

  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [streaming, setStreaming] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  const persistSession = useCallback(
    (id: string) => {
      sessionIdRef.current = id;
      try {
        localStorage.setItem(key, id);
      } catch (error) {
        // Storage may be unavailable (private mode); the session still works in memory.
        console.warn("[chat] could not persist session id:", error);
      }
    },
    [key],
  );

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(key);
    } catch (error) {
      console.warn("[chat] localStorage unavailable:", error);
    }
    if (!stored) return;

    sessionIdRef.current = stored;
    const controller = new AbortController();
    const params = new URLSearchParams({ organizationId, sessionId: stored });

    fetch(`${endpoint}?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { messages?: ChatMessageView[] };
        setMessages(data.messages ?? []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // A failed history load is non-fatal; the user can still chat.
        console.warn("[chat] history load failed:", error);
      });

    return () => controller.abort();
  }, [key, endpoint, organizationId]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      setMessages((prev) => [...prev, { id: makeId(), role: "user", content: trimmed }]);
      setStreaming(true);

      const assistantId = makeId();
      let content = "";
      let added = false;

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            sessionId: sessionIdRef.current,
            message: trimmed,
          }),
        });

        if (!res.ok || !res.body) throw new Error(`Request failed with status ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;

            let event: ChatStreamEvent;
            try {
              event = JSON.parse(payload) as ChatStreamEvent;
            } catch (error) {
              console.warn("[chat] skipped malformed stream event:", error);
              continue;
            }

            if (event.type === "session" && event.sessionId) {
              persistSession(event.sessionId);
            } else if (event.type === "delta" && event.content) {
              content += event.content;
              const snapshot = content;
              if (!added) {
                added = true;
                setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: snapshot }]);
              } else {
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: snapshot } : m)),
                );
              }
            }
          }
        }

        // Stream ended without a single delta (e.g. an error event).
        if (!added) {
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: "assistant", content: "", notice: "empty" },
          ]);
        }
      } catch (error) {
        console.error("[chat] request failed:", error);
        setMessages((prev) => [
          ...prev,
          { id: makeId(), role: "assistant", content: "", notice: "error" },
        ]);
      } finally {
        setStreaming(false);
      }
    },
    [endpoint, organizationId, persistSession, streaming],
  );

  /** Starts a fresh conversation: forgets the stored session and clears the transcript. */
  const reset = useCallback(() => {
    sessionIdRef.current = null;
    setMessages([]);
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn("[chat] could not clear session id:", error);
    }
  }, [key]);

  return { messages, streaming, send, reset };
}
