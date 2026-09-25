import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Glass surface recipe shared by every panel: slate-900/50 on the slate-950
// canvas with a hairline slate-800 border. Padding is the caller's concern
// (`className="p-5"`) unless the CardHeader/Content/Footer parts are used.
const cardVariants = cva("rounded-xl", {
  variants: {
    variant: {
      /** Structural container: page sections, list wrappers. */
      section: "border border-slate-800 bg-slate-900/50 backdrop-blur-md",
      /** A discrete interactive unit (a tile, a row) — border brightens on hover. */
      item: "border border-slate-800 bg-slate-900/50 backdrop-blur-md transition-colors duration-150 hover:border-slate-700",
      /** Popovers and floating panels — opaque so content behind never bleeds through. */
      raised: "border border-slate-800 bg-slate-900 shadow-xl shadow-black/30",
      // Liquid Glass: frosted material (see .liquid-surface in globals.css),
      // theme-aware via --card/--foreground, with an optional hover lift for
      // interactive tiles (stat cards, pricing offer card).
      liquid:
        "liquid-surface border-transparent transition-[transform,box-shadow] duration-200 ease-out data-[interactive=true]:hover:-translate-y-1 data-[interactive=true]:hover:shadow-2xl data-[interactive=true]:hover:shadow-black/20",
    },
  },
  defaultVariants: {
    variant: "section",
  },
})

function Card({
  className,
  variant,
  interactive = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    /** Liquid variant only: adds a hover lift, for a clickable tile rather than a static panel. */
    interactive?: boolean
  }) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      data-interactive={interactive || undefined}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1 p-5 pb-3", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-sm font-semibold tracking-tight text-slate-100", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-slate-400", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-5 pt-0", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-2 border-t border-slate-800 p-4", className)}
      {...props}
    />
  )
}

export { Card, cardVariants, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
