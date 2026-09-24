"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { Progress } from "@/core/ui/primitives/progress";
import type { UsageMetricSummary } from "@/modules/billing/types";

/**
 * Zero-prop slot contribution (same contract as other module widgets), so it
 * starts empty — real metric data lands via a future data-fetching step.
 */
export default function UsageTracker() {
  const [metrics] = useState<UsageMetricSummary[]>([]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.length === 0 ? (
          <p className="text-sm text-slate-400">No active usage tracking metrics.</p>
        ) : (
          metrics.map((item) => {
            const percent = item.limit > 0 ? Math.min(100, (item.used / item.limit) * 100) : 0;
            return (
              <div key={item.metric} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.metric}</span>
                  <span className="text-slate-400">
                    {item.used} / {item.limit} {item.unit ?? ""}
                  </span>
                </div>
                <Progress value={percent} />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
