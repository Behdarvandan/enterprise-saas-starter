"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/input";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface TestPlaygroundCardCopy {
  title: string;
  inputPlaceholder: string;
  sendButton: string;
  emptyHint: string;
  simulatedReply: string;
}

/** Fully local simulation: no real LLM call — the assistant reply is a templated string. */
export default function TestPlaygroundCard({ copy }: { copy: TestPlaygroundCardCopy }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text: trimmed };
    setMessages((current) => [...current, userMessage]);
    setDraft("");

    setTimeout(() => {
      const replyText = copy.simulatedReply.replace("{message}", trimmed);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", text: replyText },
      ]);
    }, 600);
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex h-64 flex-col gap-2 overflow-y-auto rounded-md border border-border bg-muted p-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.emptyHint}</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "self-end bg-primary text-primary-foreground"
                    : "self-start bg-card text-foreground",
                )}
              >
                {message.text}
              </div>
            ))
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder={copy.inputPlaceholder}
          />
          <Button type="button" size="icon" onClick={handleSend} aria-label={copy.sendButton}>
            <Send />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
