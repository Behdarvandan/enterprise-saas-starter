import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "warn" | "error" | "neutral" | "violet";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  warn: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  error: "border-red-400/20 bg-red-400/10 text-red-400",
  neutral: "border-slate-700 bg-slate-800/60 text-slate-300",
  violet: "border-violet-500/25 bg-violet-500/10 text-violet-300",
};

export default function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
