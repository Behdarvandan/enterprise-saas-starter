import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Secondary line under the value (context, unit, trend). */
  hint?: ReactNode;
}

/** One KPI tile: label, a large monospace figure, optional context line. */
export default function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card className="rounded-interactive p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-ink-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </Card>
  );
}
