import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "section" | "item" | "raised";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  /**
   * "section" — a structural container (page sections, list wrappers): 0
   * radius, sits on bg-surface. "item" — a discrete unit inside a section
   * (a row, a stat tile): rounded-interactive. "raised" — modals/popovers.
   */
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  section: "rounded-none border border-subtle bg-surface",
  item: "rounded-interactive border border-subtle bg-surface",
  raised: "rounded-interactive border border-subtle bg-surface-raised shadow-lg",
};

export default function Card({
  children,
  className,
  variant = "section",
  ...props
}: CardProps) {
  return (
    <div className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </div>
  );
}
