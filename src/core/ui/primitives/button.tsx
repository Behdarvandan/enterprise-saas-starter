import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

import Spinner from "@/components/ui/Spinner"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Neutral CTA — the only element in the system that carries the zinc-950 shadow.
        default:
          "bg-primary text-primary-foreground shadow-lg shadow-zinc-950/50 hover:bg-primary-hover",
        // Landing-page primary CTA: same fill, neutral glow instead of the drop shadow.
        glow: "bg-primary text-primary-foreground shadow-[0_0_25px_rgba(100,116,139,0.25)] hover:bg-primary-hover hover:shadow-[0_0_32px_rgba(100,116,139,0.4)]",
        secondary:
          "border border-slate-800 bg-slate-900/50 text-slate-100 backdrop-blur-md hover:border-slate-700 hover:bg-slate-800/70",
        ghost: "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:text-primary-hover hover:underline",
        // Liquid Glass: frosted material (see .liquid-surface in globals.css)
        // with a hover lift and a tactile press. Theme-aware via --card/--foreground.
        liquid:
          "liquid-surface border-transparent text-foreground hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(100,116,139,0.18)] active:translate-y-0 active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        icon: "size-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Shows a spinner and blocks interaction while an action is in flight. */
    loading?: boolean
  }

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Slot.Root>
    )
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  )
}

export { Button, buttonVariants }
