"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/core/ui/primitives/card";
import { Switch } from "@/core/ui/primitives/switch";

interface MockKnowledgeDoc {
  id: string;
  title: string;
  assigned: boolean;
}

/** Titles mirror /app/knowledge's real DOCUMENTS mock array for cross-page consistency. No real assignment persists anywhere. */
const DOCUMENTS: MockKnowledgeDoc[] = [
  { id: "1", title: "Refund policy.pdf", assigned: true },
  { id: "2", title: "Onboarding checklist.md", assigned: true },
  { id: "3", title: "Pricing FAQ", assigned: false },
  { id: "4", title: "Terms of service.pdf", assigned: true },
  { id: "5", title: "Employee handbook.docx", assigned: false },
  { id: "6", title: "Shipping regions.json", assigned: false },
];

interface KnowledgeBaseBindingCardCopy {
  title: string;
  description: string;
}

export default function KnowledgeBaseBindingCard({ copy }: { copy: KnowledgeBaseBindingCardCopy }) {
  const [assigned, setAssigned] = useState<Record<string, boolean>>(
    Object.fromEntries(DOCUMENTS.map((doc) => [doc.id, doc.assigned])),
  );

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {DOCUMENTS.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between gap-2">
            <span className="text-sm text-foreground">{doc.title}</span>
            <Switch
              checked={assigned[doc.id]}
              onCheckedChange={(checked) =>
                setAssigned((current) => ({ ...current, [doc.id]: checked }))
              }
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
