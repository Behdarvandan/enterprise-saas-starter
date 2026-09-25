import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/core/ui/primitives/card";

/**
 * Landing-page card. A thin pass-through to the core `Card` primitive, kept
 * as its own export since callers pass a plain `<div>`-shaped `className`
 * (padding, layout) rather than Card's variant props.
 */
export default function GlassPanel({ className, ...props }: ComponentProps<"div">) {
  return <Card variant="section" className={cn("rounded-2xl", className)} {...props} />;
}
