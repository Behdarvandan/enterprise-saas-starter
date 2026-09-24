"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";

/** Minimal visible proof that slot injection reaches a real module component. */
export default function DemoWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo Module</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-400">
          Injected via the dashboard-overview-slot slot contribution.
        </p>
      </CardContent>
    </Card>
  );
}
