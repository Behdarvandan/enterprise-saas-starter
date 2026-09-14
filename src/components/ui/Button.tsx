import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-violet text-white shadow-sm hover:bg-violet/90",
  secondary:
    "bg-surface-raised text-ink-primary border border-subtle hover:border-violet-dim/60",
  ghost: "bg-transparent text-ink-muted hover:bg-surface-raised hover:text-ink-primary",
  danger: "bg-status-error text-white shadow-sm hover:bg-status-error/90",
};

export default function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-interactive px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
