"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { Slider } from "@/core/ui/primitives/slider";

interface HybridSearchWeightCardCopy {
  title: string;
  description: string;
  /** Raw templates with a `{percent}` placeholder, interpolated client-side as the slider moves. */
  denseLabelTemplate: string;
  bm25LabelTemplate: string;
}

export default function HybridSearchWeightCard({ copy }: { copy: HybridSearchWeightCardCopy }) {
  const [denseWeight, setDenseWeight] = useState(60);
  const bm25Weight = 100 - denseWeight;

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Slider value={[denseWeight]} onValueChange={([value]) => setDenseWeight(value)} min={0} max={100} step={5} />

        <div className="flex h-2 w-full overflow-hidden rounded-full">
          <div className="h-full bg-primary" style={{ width: `${denseWeight}%` }} />
          <div className="h-full bg-muted-foreground/40" style={{ width: `${bm25Weight}%` }} />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">{copy.denseLabelTemplate.replace("{percent}", String(denseWeight))}</span>
          <span className="text-muted-foreground">{copy.bm25LabelTemplate.replace("{percent}", String(bm25Weight))}</span>
        </div>
      </CardContent>
    </Card>
  );
}
