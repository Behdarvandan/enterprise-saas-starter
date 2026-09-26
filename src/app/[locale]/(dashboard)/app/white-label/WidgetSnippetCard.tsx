"use client";

import { Check, Copy, MessageCircle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/input";
import { NativeSelect } from "@/core/ui/primitives/native-select";
import { Textarea } from "@/core/ui/primitives/textarea";

type WidgetPosition = "bottom-right" | "bottom-left";

interface ChatWidgetConfig {
  position: WidgetPosition;
  accentColor: string;
  greeting: string;
  agentName: string;
}

function buildWidgetSnippet(config: ChatWidgetConfig): string {
  return `<script
  src="https://cdn.pasargad.ai/widget.js"
  data-tenant="YOUR_WORKSPACE_ID"
  data-position="${config.position}"
  data-accent-color="${config.accentColor}"
  data-agent-name="${config.agentName}"
  data-greeting="${config.greeting}"
  async
></script>`;
}

interface WidgetSnippetCardCopy {
  title: string;
  description: string;
  positionLabel: string;
  positionBottomRight: string;
  positionBottomLeft: string;
  accentColorLabel: string;
  greetingLabel: string;
  greetingPlaceholder: string;
  agentNameLabel: string;
  agentNamePlaceholder: string;
  snippetLabel: string;
  copyButton: string;
  previewLabel: string;
}

/** UI-only: never loads the generated script anywhere — the preview is pure CSS, and the copy button only copies text. */
export default function WidgetSnippetCard({ copy }: { copy: WidgetSnippetCardCopy }) {
  const [position, setPosition] = useState<WidgetPosition>("bottom-right");
  const [accentColor, setAccentColor] = useState("#0f766e");
  const [greeting, setGreeting] = useState("Hi! How can we help?");
  const [agentName, setAgentName] = useState("Support triage");
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();

  const snippet = useMemo(
    () => buildWidgetSnippet({ position, accentColor, greeting, agentName }),
    [position, accentColor, greeting, agentName],
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="widget-position" className="text-sm font-medium text-foreground">
              {copy.positionLabel}
            </label>
            <NativeSelect
              id="widget-position"
              value={position}
              onChange={(event) => setPosition(event.target.value as WidgetPosition)}
            >
              <option value="bottom-right">{copy.positionBottomRight}</option>
              <option value="bottom-left">{copy.positionBottomLeft}</option>
            </NativeSelect>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="widget-accent" className="text-sm font-medium text-foreground">
              {copy.accentColorLabel}
            </label>
            <Input
              id="widget-accent"
              type="color"
              value={accentColor}
              onChange={(event) => setAccentColor(event.target.value)}
              className="h-9 w-16 cursor-pointer p-1"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="widget-agent-name" className="text-sm font-medium text-foreground">
              {copy.agentNameLabel}
            </label>
            <Input
              id="widget-agent-name"
              value={agentName}
              onChange={(event) => setAgentName(event.target.value)}
              placeholder={copy.agentNamePlaceholder}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="widget-greeting" className="text-sm font-medium text-foreground">
              {copy.greetingLabel}
            </label>
            <Input
              id="widget-greeting"
              value={greeting}
              onChange={(event) => setGreeting(event.target.value)}
              placeholder={copy.greetingPlaceholder}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">{copy.previewLabel}</span>
          <div className="relative h-56 overflow-hidden rounded-md border border-border bg-muted">
            <div
              className="absolute bottom-4 flex max-w-[220px] flex-col gap-2"
              style={position === "bottom-right" ? { insetInlineEnd: "1rem" } : { insetInlineStart: "1rem" }}
            >
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground shadow-popover">
                <p className="font-medium">{agentName}</p>
                <p className="text-muted-foreground">{greeting}</p>
              </div>
              <motion.div
                className="flex size-11 items-center justify-center self-end rounded-full shadow-popover"
                style={{ backgroundColor: accentColor }}
                whileHover={reduceMotion ? undefined : { scale: 1.04, y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <MessageCircle aria-hidden className="size-5 text-white" />
              </motion.div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{copy.snippetLabel}</span>
            <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
              <span className="t-icon-swap" data-state={copied ? "b" : "a"}>
                <Copy className="t-icon" data-icon="a" aria-hidden />
                <Check className="t-icon text-primary" data-icon="b" aria-hidden />
              </span>
              {copy.copyButton}
            </Button>
          </div>
          <Textarea readOnly rows={7} value={snippet} className="font-mono text-xs" />
        </div>
      </CardContent>
    </Card>
  );
}
