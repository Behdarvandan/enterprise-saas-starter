import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "success" | "warn" | "error" | "neutral";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  success: "bg-status-success/10 text-status-success",
  warn: "bg-status-warn/10 text-status-warn",
  error: "bg-status-error/10 text-status-error",
  neutral: "bg-subtle/60 text-ink-muted",
};

export default function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-control px-2 py-0.5 text-xs font-semibold capitalize",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
