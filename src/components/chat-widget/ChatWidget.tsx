"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, X } from "lucide-react";
import type { ChatStreamEvent } from "@/types";

interface WidgetMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatWidgetProps {
  /** The tenant identifier the widget is bound to. */
  organizationId: string;
  /** Absolute origin of the host application (e.g. "https://app.example.com"). */
  apiBaseUrl?: string;
  /** Launcher button label, used as the panel heading. */
  title?: string;
  /** Where the floating launcher is anchored. */
  position?: "bottom-right" | "bottom-left";
  /** Opens the panel and sends this as the first message, once. */
  initialQuery?: string;
}

/** Generates a unique id that is safe to call in the browser. */
function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ChatWidget({
  organizationId,
  apiBaseUrl = "",
  title = "AI Assistant",
  position = "bottom-right",
  initialQuery,
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const storageKey = `rag-chat-session:${organizationId}`;
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/api/chat/rag`;

  const persistSession = useCallback(
    (id: string) => {
      setSessionId(id);
      try {
        localStorage.setItem(storageKey, id);
      } catch {
        // Storage may be unavailable (private mode); the session still works.
      }
    },
    [storageKey],
  );

  const loadHistory = useCallback(
    async (id: string) => {
      try {
        const params = new URLSearchParams({ organizationId, sessionId: id });
        const res = await fetch(`${endpoint}?${params.toString()}`);
        if (!res.ok) return;
        const data = (await res.json()) as { messages?: WidgetMessage[] };
        setMessages(data.messages ?? []);
      } catch {
        // A failed history load is non-fatal; the visitor can still chat.
      }
    },
    [endpoint, organizationId],
  );

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(storageKey);
    } catch {
      stored = null;
    }
    if (stored) {
      setSessionId(stored);
      loadHistory(stored);
    }
  }, [storageKey, loadHistory]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming]);

  const sentInitialQuery = useRef(false);
  useEffect(() => {
    if (!initialQuery || sentInitialQuery.current) return;
    sentInitialQuery.current = true;
    setOpen(true);
    sendMessage(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  async function sendMessage(override?: string) {
    const text = (override ?? input).trim();
    if (!text || streaming) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: makeId(), role: "user", content: text },
    ]);
    setStreaming(true);

    const assistantId = makeId();
    let assistantContent = "";
    let assistantAdded = false;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, sessionId, message: text }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Request failed with status ${res.status}`);
      }

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
          } catch {
            continue;
          }

          if (event.type === "session" && event.sessionId) {
            persistSession(event.sessionId);
          } else if (event.type === "delta" && event.content) {
            assistantContent += event.content;
            if (!assistantAdded) {
              assistantAdded = true;
              setMessages((prev) => [
                ...prev,
                { id: assistantId, role: "assistant", content: assistantContent },
              ]);
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m,
                ),
              );
            }
          }
        }
      }

      // If the stream ended without any delta (e.g. an error event), render it.
      if (!assistantAdded) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: assistantContent || "I could not generate a response.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  const launcherClass = position === "bottom-left" ? "left-4" : "right-4";

  return (
    <>
      {/* Launcher button */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close chat" : "Open chat"}
        className={`fixed bottom-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet text-white shadow-lg transition hover:bg-violet/90 ${launcherClass}`}
      >
        {open ? <X size={24} /> : <Bot size={24} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={`fixed bottom-20 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-subtle bg-surface shadow-2xl ${launcherClass}`}
          style={{ height: "min(28rem, calc(100vh - 7rem))" }}
        >
          <header className="flex items-center gap-2 border-b border-subtle bg-surface px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet text-white">
              <Bot size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-primary">{title}</p>
              <p className="text-xs text-ink-muted">Online · AI knowledge base</p>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-canvas px-4 py-4"
          >
            {messages.length === 0 && (
              <div className="rounded-lg bg-surface p-4 text-sm text-ink-muted shadow-sm">
                Hi there! Ask me anything about our products and services.
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    message.role === "user"
                      ? "bg-violet text-white"
                      : "bg-surface text-ink-primary"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {streaming && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl bg-surface px-3 py-2 shadow-sm">
                  <Loader2 size={16} className="animate-spin text-violet-dim" />
                  <span className="text-sm text-ink-muted">Thinking…</span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2 border-t border-subtle bg-surface p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your message…"
              disabled={streaming}
              className="flex-1 rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-violet-dim disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet text-white transition hover:bg-violet/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
