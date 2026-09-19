"use client";

import { Bot, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import ChatPanel from "@/components/chat-widget/ChatPanel";
import { useRagChat } from "@/components/chat-widget/useRagChat";
import LiveDot from "@/components/ui/LiveDot";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  /** The tenant identifier the widget is bound to. */
  organizationId: string;
  /** Absolute origin of the host application (e.g. "https://app.example.com"). */
  apiBaseUrl?: string;
  /** Heading of the panel; defaults to the localized "AI assistant". */
  title?: string;
  /** Where the floating launcher is anchored. */
  position?: "bottom-right" | "bottom-left";
  /** Opens the panel and sends this as the first message, once. */
  initialQuery?: string;
}

/** Floating launcher + panel. The embeddable surface visitors see. */
export default function ChatWidget({
  organizationId,
  apiBaseUrl = "",
  title,
  position = "bottom-right",
  initialQuery,
}: ChatWidgetProps) {
  const t = useTranslations("chatWidget");
  const [open, setOpen] = useState(false);
  const { messages, streaming, send } = useRagChat({ organizationId, apiBaseUrl });

  const sentInitialQuery = useRef(false);
  useEffect(() => {
    if (!initialQuery || sentInitialQuery.current) return;
    sentInitialQuery.current = true;
    setOpen(true);
    void send(initialQuery);
  }, [initialQuery, send]);

  const anchor = position === "bottom-left" ? "start-4" : "end-4";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? t("close") : t("open")}
        aria-expanded={open}
        className={cn(
          "fixed bottom-4 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-violet-950/50 transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring/60",
          anchor,
        )}
      >
        {open ? <X aria-hidden size={24} /> : <Bot aria-hidden size={24} />}
      </button>

      {open ? (
        <section
          aria-label={title ?? t("defaultTitle")}
          className={cn(
            "fixed bottom-20 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/40",
            anchor,
          )}
          style={{ height: "min(28rem, calc(100vh - 7rem))" }}
        >
          <header className="flex items-center gap-3 border-b border-slate-800 bg-slate-900/60 px-4 py-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot aria-hidden size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-100">{title ?? t("defaultTitle")}</p>
              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <LiveDot />
                {t("online")}
              </p>
            </div>
          </header>
          <ChatPanel messages={messages} streaming={streaming} onSend={(text) => void send(text)} className="flex-1" />
        </section>
      ) : null}
    </>
  );
}
