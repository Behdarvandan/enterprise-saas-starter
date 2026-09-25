"use client"

import * as React from "react"
import { cn } from "cn"
import { Slider as SliderPrimitive } from "radix-ui"

/**
 * Single-thumb range input. Radix flips the fill direction in RTL when the
 * `dir` prop follows the document, so callers pass `dir` explicitly.
 */
function Slider({
  className,
  thumbLabel,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  /** Accessible name of the thumb (Radix only auto-labels multi-thumb sliders). */
  thumbLabel?: string
}) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex h-5 w-full touch-none items-center select-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb aria-label={thumbLabel} className="block size-5 rounded-full border-2 border-primary bg-background shadow-[0_0_0_4px_rgba(100,116,139,0.15)] transition-[box-shadow] duration-150 outline-none hover:shadow-[0_0_0_6px_rgba(100,116,139,0.25)] focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background" />
    </SliderPrimitive.Root>
  )
}

export { Slider }
