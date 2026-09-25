"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/input";

interface DomainSetupCardCopy {
  title: string;
  domainLabel: string;
  domainPlaceholder: string;
  cnameLabel: string;
  copyButton: string;
  statusVerified: string;
  statusPending: string;
}

/** UI-only placeholder: mirrors the real domain-verification flow at src/lib/agency/cname.ts, but this page has no server wiring. */
export default function DomainSetupCard({
  domain,
  cnameTarget,
  status,
  copy,
}: {
  domain: string;
  cnameTarget: string;
  status: "verified" | "pending";
  copy: DomainSetupCardCopy;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(cnameTarget);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>{copy.title}</CardTitle>
        <Badge variant={status === "verified" ? "default" : "secondary"}>
          {status === "verified" ? copy.statusVerified : copy.statusPending}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="white-label-domain" className="text-sm font-medium text-foreground">
            {copy.domainLabel}
          </label>
          <Input id="white-label-domain" defaultValue={domain} placeholder={copy.domainPlaceholder} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">{copy.cnameLabel}</span>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
            <code className="flex-1 truncate text-sm text-foreground">{cnameTarget}</code>
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
        </div>
      </CardContent>
    </Card>
  );
}
