"use client";

import { useState } from "react";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/primitives/select";

interface VectorEngineCardCopy {
  title: string;
  embeddingModelLabel: string;
  chunkSizeLabel: string;
  chunkOverlapLabel: string;
  syncButton: string;
}

/** UI-only mock: shows the real embedding model + chunking defaults (src/lib/rag/embeddings.ts, chunking.ts) but has no reindex wiring — none exists. */
export default function VectorEngineCard({
  embeddingModel,
  chunkSize,
  chunkOverlap,
  copy,
}: {
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  copy: VectorEngineCardCopy;
}) {
  const [model, setModel] = useState(embeddingModel);

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="vector-embedding-model" className="text-sm font-medium text-foreground">
            {copy.embeddingModelLabel}
          </label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="vector-embedding-model" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={embeddingModel}>{embeddingModel}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="vector-chunk-size" className="text-sm font-medium text-foreground">
              {copy.chunkSizeLabel}
            </label>
            <Input id="vector-chunk-size" type="number" defaultValue={chunkSize} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="vector-chunk-overlap" className="text-sm font-medium text-foreground">
              {copy.chunkOverlapLabel}
            </label>
            <Input id="vector-chunk-overlap" type="number" defaultValue={chunkOverlap} />
          </div>
        </div>

        <Button type="button" variant="secondary" className="self-start" disabled>
          {copy.syncButton}
        </Button>
      </CardContent>
    </Card>
  );
}
