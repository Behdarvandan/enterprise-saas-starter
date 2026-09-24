import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import LiveDot from "@/components/ui/LiveDot";
import { Card } from "@/core/ui/primitives/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  /** Pre-formatted value — formatting is locale-dependent and belongs to the caller. */
  value: string;
  icon?: LucideIcon;
  /** Small line under the value (unit, window, reset date…). */
  hint?: string;
  /** Shows a pulsing live indicator next to the label. */
  live?: boolean;
  /** Extra content under the hint, e.g. a Progress bar. */
  children?: ReactNode;
  className?: string;
}

/** KPI tile. Values are always mono + tabular so digits don't jitter between refreshes. */
export default function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  live,
  children,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("flex flex-col gap-3 p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-medium text-slate-400">
          {live ? <LiveDot /> : null}
          {label}
        </p>
        {Icon ? <Icon aria-hidden className="size-4 text-slate-500" /> : null}
      </div>
      <p dir="ltr" className="text-start font-mono text-2xl font-semibold tabular-nums text-violet-400">
        {value}
      </p>
      {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
      {children}
    </Card>
  );
}
