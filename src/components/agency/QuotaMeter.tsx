import { Progress } from "@/components/ui/progress";
import { NEAR_LIMIT_PERCENT } from "@/lib/agency/usage";

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
  const barTone =
    tone === "neutral" || percent < NEAR_LIMIT_PERCENT ? "primary" : percent >= 100 ? "error" : "warn";

  return <Progress value={percent} tone={barTone} aria-label={label} className={className} />;
}
