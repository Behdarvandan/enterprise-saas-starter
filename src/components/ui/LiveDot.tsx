import { cn } from "@/lib/utils";

type LiveDotTone = "live" | "warn" | "error" | "idle";

const toneClass: Record<LiveDotTone, string> = {
  live: "bg-emerald-500 animate-pulse",
  warn: "bg-amber-500",
  error: "bg-red-400",
  idle: "bg-slate-600",
};

interface LiveDotProps {
  tone?: LiveDotTone;
  className?: string;
}

/** Presence indicator. Only the `live` tone pulses (reduced-motion is honoured globally). */
export default function LiveDot({ tone = "live", className }: LiveDotProps) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", toneClass[tone], className)}
    />
  );
}
