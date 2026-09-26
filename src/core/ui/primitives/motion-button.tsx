"use client";

import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { buttonVariants } from "@/core/ui/primitives/button";

type MotionButtonProps = Omit<HTMLMotionProps<"button">, "children"> &
  VariantProps<typeof buttonVariants> & {
    children?: React.ReactNode;
  };

/**
 * Button with restrained hover/tap spring physics — a separate leaf client
 * component so `button.tsx` itself stays server-safe for its many existing
 * call sites. Reserve this for the rare CTA that should feel tactile (e.g.
 * paired with the `shimmer`/`glow` variants); most buttons don't need it.
 * Does not support `asChild`.
 */
export function MotionButton({
  className,
  variant = "default",
  size = "default",
  ...props
}: MotionButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    />
  );
}
