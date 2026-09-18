import { NEAR_LIMIT_PERCENT } from "@/lib/agency/usage";
import { cn } from "@/lib/utils";

interface QuotaMeterProps {
  /** 0-100. */
  percent: number;
  /** Accessible name, e.g. "Acme token consumption". */
  label: string;
  /**
   * `usage` colors the bar by how close it is to the limit; `neutral` is for
   * plain proportions (e.g. how much of the pool is allocated).
   */
  tone?: "usage" | "neutral";
  className?: string;
}

/** Thin progress bar shared by the pool summary and each tenant row. */
export default function QuotaMeter({ percent, label, tone = "usage", className }: QuotaMeterProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const color =
    tone === "neutral"
      ? "bg-violet"
      : clamped >= 100
        ? "bg-status-error"
        : clamped >= NEAR_LIMIT_PERCENT
          ? "bg-status-warn"
          : "bg-violet";

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-subtle", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-300", color)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
