"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { SpotlightCard } from "@/core/ui/primitives/spotlight-card";

interface BentoRevealCardProps extends React.ComponentProps<typeof SpotlightCard> {
  /** Applied to the outer motion wrapper — use for grid placement (col/row-span) rather than the card's own className, since that stays on the SpotlightCard itself. */
  wrapperClassName?: string;
}

/** Bento cell that fades/rises into view once (motion `whileInView`) and carries a restrained mouse-tracking spotlight (SpotlightCard). Reduced-motion renders at final state immediately. */
export function BentoRevealCard({ wrapperClassName, className, ...props }: BentoRevealCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("h-full", wrapperClassName)}
    >
      <SpotlightCard {...props} className={cn("h-full", className)} />
    </motion.div>
  );
}
