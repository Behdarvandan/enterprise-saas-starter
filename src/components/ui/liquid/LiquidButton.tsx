import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/core/ui/primitives/button";

/**
 * Liquid Glass button — a thin pass-through to `@/core/ui/primitives/button`
 * defaulting to `variant="liquid"`, so the frosted-glass recipe stays
 * defined once in the primitive (per the repo's UI Component Rule) instead
 * of being reimplemented here.
 */
function LiquidButton({
  variant = "liquid",
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  return <Button variant={variant} {...props} />;
}

export { LiquidButton };
