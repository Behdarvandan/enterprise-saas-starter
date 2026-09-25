import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import {
  Card,
  cardVariants,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/core/ui/primitives/card";

/**
 * Liquid Glass surface — a thin pass-through to `@/core/ui/primitives/card`
 * defaulting to `variant="liquid"`, so the frosted-glass recipe stays
 * defined once in the primitive (per the repo's UI Component Rule) instead
 * of being reimplemented here.
 */
function LiquidCard({
  variant = "liquid",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants> & { interactive?: boolean }) {
  return <Card variant={variant} {...props} />;
}

export { LiquidCard, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
