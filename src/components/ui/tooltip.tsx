"use client"

import * as React from "react"
import { cn } from "cn"
import { Tooltip as TooltipPrimitive } from "radix-ui"

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: React.ComponentProps<typeof TooltipPrimitive.Content>["side"]
  className?: string
}

/** Self-contained tooltip: bundles its own provider so callers need no app-level setup. */
function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className={cn(
              "z-50 max-w-xs rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 shadow-xl shadow-black/30 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0",
              className
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export { Tooltip }
