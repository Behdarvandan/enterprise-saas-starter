"use client";

import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";

interface ApiKeysCardCopy {
  title: string;
  currentKeyLabel: string;
  generateButton: string;
  copyButton: string;
  revealButton: string;
  hideButton: string;
}

function randomSuffix(): string {
  return Math.random().toString(16).slice(2, 6);
}

function maskedKey(suffix: string): string {
  return `sk_live_${"•".repeat(24)}${suffix}`;
}

/** UI-only mock: mirrors the real single-key-per-org model at POST /api/client/license/rotate, but has no network wiring. */
export default function ApiKeysCard({
  apiKeySuffix,
  copy,
}: {
  apiKeySuffix: string;
  copy: ApiKeysCardCopy;
}) {
  const [suffix, setSuffix] = useState(apiKeySuffix);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(maskedKey(suffix));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function handleGenerate() {
    setSuffix(randomSuffix());
    setRevealed(false);
  }

  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>{copy.title}</CardTitle>
        <Button type="button" variant="default" size="sm" onClick={handleGenerate}>
          {copy.generateButton}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">{copy.currentKeyLabel}</span>
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
          <code className="flex-1 truncate text-sm text-foreground">
            {revealed ? `sk_live_${"a1b2c3d4e5f6a1b2c3d4e5f6"}${suffix}` : maskedKey(suffix)}
          </code>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? copy.hideButton : copy.revealButton}
          >
            {revealed ? <EyeOff /> : <Eye />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={handleCopy}
            aria-label={copy.copyButton}
          >
            {copied ? <Check className="text-primary" /> : <Copy />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
