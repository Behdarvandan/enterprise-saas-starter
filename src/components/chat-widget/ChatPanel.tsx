"use client";

import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessageView } from "@/components/chat-widget/useRagChat";

interface ChatPanelProps {
  messages: ChatMessageView[];
  streaming: boolean;
  onSend: (text: string) => void;
  /** Quick prompts shown while the transcript is empty. */
  suggestions?: string[];
  className?: string;
}

/** Transcript + composer shared by the floating widget and the inline simulator. */
export default function ChatPanel({ messages, streaming, onSend, suggestions, className }: ChatPanelProps) {
  const t = useTranslations("chatWidget");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setInput("");
    onSend(trimmed);
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label={t("transcript")}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300">
              {t("greeting")}
            </p>
            {suggestions?.length ? (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => submit(suggestion)}
                    disabled={streaming}
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-primary/60 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {messages.map((message) => (
          <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : message.notice
                    ? "border border-red-400/20 bg-red-400/10 text-red-300"
                    : "border border-slate-800 bg-slate-900 text-slate-100",
              )}
            >
              {message.notice === "error"
                ? t("errorGeneric")
                : message.notice === "empty"
                  ? t("errorEmpty")
                  : message.content}
            </div>
          </div>
        ))}

        {streaming ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2">
              <Loader2 aria-hidden className="size-4 animate-spin text-primary" />
              <span className="text-sm text-slate-400">{t("thinking")}</span>
            </div>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
        className="flex items-center gap-2 border-t border-slate-800 p-3"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          disabled={streaming}
          className="h-9 flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100 transition-colors outline-none placeholder:text-slate-500 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          aria-label={t("send")}
          className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-zinc-950/50 transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send aria-hidden className="size-4 rtl:-scale-x-100" />
        </button>
      </form>
    </div>
  );
}
