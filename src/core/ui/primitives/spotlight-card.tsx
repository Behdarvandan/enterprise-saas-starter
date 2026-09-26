"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/core/ui/primitives/card";

type SpotlightCardProps = React.ComponentProps<typeof Card>;

/**
 * Card with a restrained, mouse-tracking Aceternity-inspired spotlight (see
 * `.aceternity-spotlight` in globals.css — hand-built, no package installed;
 * capped at 8% of `--primary`, invisible until hover/focus). Use sparingly
 * (e.g. the marketing Bento grid), not as a default Card treatment.
 */
export function SpotlightCard({ className, onMouseMove, ...props }: SpotlightCardProps) {
  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    onMouseMove?.(event);
  }

  return (
    <Card
      {...props}
      onMouseMove={handleMouseMove}
      className={cn("aceternity-spotlight", className)}
    />
  );
}
