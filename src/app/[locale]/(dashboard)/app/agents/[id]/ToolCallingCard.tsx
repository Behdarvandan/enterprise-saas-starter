"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/input";
import { NativeSelect } from "@/core/ui/primitives/native-select";
import { Switch } from "@/core/ui/primitives/switch";
import { Textarea } from "@/core/ui/primitives/textarea";

type AgentToolId = "webSearch" | "customWebhook" | "sqlQuery";
type WebhookMethod = "GET" | "POST";

interface ToolCallingCardCopy {
  title: string;
  description: string;
  webSearchLabel: string;
  webhookLabel: string;
  webhookMethodLabel: string;
  webhookUrlLabel: string;
  webhookUrlPlaceholder: string;
  sqlQueryLabel: string;
  sqlTemplateLabel: string;
  sqlTemplatePlaceholder: string;
  sqlMockHint: string;
}

export default function ToolCallingCard({ copy }: { copy: ToolCallingCardCopy }) {
  const [enabled, setEnabled] = useState<Record<AgentToolId, boolean>>({
    webSearch: true,
    customWebhook: false,
    sqlQuery: false,
  });
  const [webhookMethod, setWebhookMethod] = useState<WebhookMethod>("POST");

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">{copy.webSearchLabel}</span>
          <Switch
            checked={enabled.webSearch}
            onCheckedChange={(checked) => setEnabled((current) => ({ ...current, webSearch: checked }))}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{copy.webhookLabel}</span>
            <Switch
              checked={enabled.customWebhook}
              onCheckedChange={(checked) => setEnabled((current) => ({ ...current, customWebhook: checked }))}
            />
          </div>
          {enabled.customWebhook ? (
            <div className="flex flex-col gap-2 ps-1">
              <div className="flex items-center gap-2">
                <label htmlFor="tool-webhook-method" className="text-xs text-muted-foreground">
                  {copy.webhookMethodLabel}
                </label>
                <NativeSelect
                  id="tool-webhook-method"
                  value={webhookMethod}
                  onChange={(event) => setWebhookMethod(event.target.value as WebhookMethod)}
                  className="w-28"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </NativeSelect>
              </div>
              <Input placeholder={copy.webhookUrlPlaceholder} aria-label={copy.webhookUrlLabel} />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{copy.sqlQueryLabel}</span>
            <Switch
              checked={enabled.sqlQuery}
              onCheckedChange={(checked) => setEnabled((current) => ({ ...current, sqlQuery: checked }))}
            />
          </div>
          {enabled.sqlQuery ? (
            <div className="flex flex-col gap-1 ps-1">
              <Textarea rows={2} placeholder={copy.sqlTemplatePlaceholder} aria-label={copy.sqlTemplateLabel} className="font-mono text-xs" />
              <p className="text-xs text-muted-foreground">{copy.sqlMockHint}</p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
