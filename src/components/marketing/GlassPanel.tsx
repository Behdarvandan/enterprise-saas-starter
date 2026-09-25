import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { LiquidCard } from "@/components/ui/liquid/LiquidCard";

/**
 * Landing-page card. Now a thin pass-through to `LiquidCard` (the frosted
 * Liquid Glass material), kept as its own export since callers pass a plain
 * `<div>`-shaped `className` (padding, layout) rather than Card's variant
 * props — this preserves that call shape while retiring the standalone
 * glass recipe this component used to hand-roll.
 */
export default function GlassPanel({ className, ...props }: ComponentProps<"div">) {
  return <LiquidCard className={cn("rounded-2xl", className)} {...props} />;
}
