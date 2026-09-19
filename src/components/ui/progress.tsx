"use client"

import * as React from "react"
import { cn } from "cn"
import { Progress as ProgressPrimitive } from "radix-ui"

type ProgressTone = "primary" | "warn" | "error" | "success"

const toneClass: Record<ProgressTone, string> = {
  primary: "bg-primary",
  warn: "bg-amber-500",
  error: "bg-red-400",
  success: "bg-emerald-500",
}

interface ProgressProps
  extends Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, "value"> {
  /** 0–100. `null` renders an indeterminate bar. */
  value: number | null
  tone?: ProgressTone
}

function Progress({ className, value, tone = "primary", ...props }: ProgressProps) {
  const clamped = value === null ? null : Math.min(100, Math.max(0, value))

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={clamped}
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-slate-800", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-out",
          toneClass[tone],
          clamped === null && "w-1/3 animate-pulse"
        )}
        style={clamped === null ? undefined : { width: `${clamped}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
