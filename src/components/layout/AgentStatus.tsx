import { useTranslations } from "next-intl";
import LiveDot from "@/components/ui/LiveDot";
import { cn } from "@/lib/utils";
import type { AgentState } from "@/lib/dashboard/metrics";

const dotTone = { live: "live", quota_low: "warn", quota_exhausted: "error", inactive: "idle" } as const;

const pillTone: Record<AgentState, string> = {
  live: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  quota_low: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  quota_exhausted: "border-red-400/20 bg-red-400/10 text-red-300",
  inactive: "border-slate-700 bg-slate-800/60 text-slate-300",
};

const labelKey = {
  live: "live",
  quota_low: "quotaLow",
  quota_exhausted: "quotaExhausted",
  inactive: "inactive",
} as const;

interface AgentStatusProps {
  state: AgentState;
  /** Whole-number share of the token quota used. */
  quotaPercent: number;
  className?: string;
}

/** Live agent presence: a pulsing emerald dot only while the agent is actually serving. */
export default function AgentStatus({ state, quotaPercent, className }: AgentStatusProps) {
  const t = useTranslations("shell.agent");

  return (
    <div
      role="status"
      title={t(`hint.${labelKey[state]}`, { percent: quotaPercent })}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
        pillTone[state],
        className,
      )}
    >
      <LiveDot tone={dotTone[state]} />
      <span>{t(labelKey[state])}</span>
    </div>
  );
}
