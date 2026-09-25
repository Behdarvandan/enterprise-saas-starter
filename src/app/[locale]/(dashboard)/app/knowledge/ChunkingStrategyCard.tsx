"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { Slider } from "@/core/ui/primitives/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/ui/primitives/tabs";
import { chunkText } from "@/lib/rag/chunking";

type ChunkingStrategy = "recursive" | "semantic";

/** Long enough sample so slider changes visibly move the chunk count in the live preview. */
const SAMPLE_TEXT = Array.from({ length: 6 })
  .map(
    () =>
      "Our refund policy covers any purchase made within the last thirty days. Customers may request a full refund by contacting support with their order number. Digital products are refundable only if unused. Physical products must be returned in their original packaging before a refund is issued.",
  )
  .join(" ");

interface ChunkingStrategyCardCopy {
  title: string;
  description: string;
  strategyRecursiveLabel: string;
  strategySemanticLabel: string;
  chunkSizeLabel: string;
  overlapLabel: string;
  semanticThresholdLabel: string;
  semanticHint: string;
  /** Raw template with `{chunks}`/`{tokens}` placeholders, interpolated client-side as slider values change. */
  previewTemplate: string;
}

export default function ChunkingStrategyCard({ copy }: { copy: ChunkingStrategyCardCopy }) {
  const [strategy, setStrategy] = useState<ChunkingStrategy>("recursive");
  const [chunkSize, setChunkSize] = useState(512);
  const [overlap, setOverlap] = useState(64);
  const [threshold, setThreshold] = useState(0.75);

  const preview = useMemo(() => {
    const chunks = chunkText(SAMPLE_TEXT, chunkSize, overlap);
    const tokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);
    return copy.previewTemplate.replace("{chunks}", String(chunks.length)).replace("{tokens}", String(tokens));
  }, [chunkSize, overlap, copy.previewTemplate]);

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs value={strategy} onValueChange={(value) => setStrategy(value as ChunkingStrategy)}>
          <TabsList>
            <TabsTrigger value="recursive">{copy.strategyRecursiveLabel}</TabsTrigger>
            <TabsTrigger value="semantic">{copy.strategySemanticLabel}</TabsTrigger>
          </TabsList>

          <TabsContent value="recursive" className="flex flex-col gap-4 pt-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{copy.chunkSizeLabel}</span>
                <span className="text-sm text-muted-foreground">{chunkSize}</span>
              </div>
              <Slider value={[chunkSize]} onValueChange={([value]) => setChunkSize(value)} min={128} max={2048} step={64} />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{copy.overlapLabel}</span>
                <span className="text-sm text-muted-foreground">{overlap}</span>
              </div>
              <Slider value={[overlap]} onValueChange={([value]) => setOverlap(value)} min={0} max={256} step={16} />
            </div>

            <p className="text-sm text-muted-foreground">{preview}</p>
          </TabsContent>

          <TabsContent value="semantic" className="flex flex-col gap-4 pt-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{copy.semanticThresholdLabel}</span>
                <span className="text-sm text-muted-foreground">{threshold.toFixed(2)}</span>
              </div>
              <Slider value={[threshold]} onValueChange={([value]) => setThreshold(value)} min={0} max={1} step={0.05} />
            </div>
            <p className="text-sm text-muted-foreground">{copy.semanticHint}</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
