"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import ChatPanel from "@/components/chat-widget/ChatPanel";
import { useRagChat } from "@/components/chat-widget/useRagChat";
import { Button } from "@/components/ui/button";
import LiveDot from "@/components/ui/LiveDot";
import { Card } from "@/components/ui/card";

interface ChatSimulatorProps {
  organizationId: string;
  /** Sent once on mount (e.g. from the header search). */
  initialQuery?: string;
  className?: string;
}

/**
 * Inline "quick test" surface: the visitor experience without leaving the
 * dashboard. Uses its own session key so test conversations never mix with
 * the floating widget's history.
 */
export default function ChatSimulator({ organizationId, initialQuery, className }: ChatSimulatorProps) {
  const t = useTranslations("chatWidget");
  const { messages, streaming, send, reset } = useRagChat({
    organizationId,
    storageKey: `rag-sim-session:${organizationId}`,
  });

  const sentInitial = useRef(false);
  useEffect(() => {
    if (!initialQuery || sentInitial.current) return;
    sentInitial.current = true;
    void send(initialQuery);
  }, [initialQuery, send]);

  return (
    <Card className={className}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-100">{t("simulatorTitle")}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
            <LiveDot />
            {t("simulatorHint")}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} disabled={streaming || messages.length === 0}>
          <RotateCcw aria-hidden />
          {t("newConversation")}
        </Button>
      </div>
      <ChatPanel
        messages={messages}
        streaming={streaming}
        onSend={(text) => void send(text)}
        suggestions={[t("suggestion1"), t("suggestion2"), t("suggestion3")]}
        className="h-[26rem]"
      />
    </Card>
  );
}
