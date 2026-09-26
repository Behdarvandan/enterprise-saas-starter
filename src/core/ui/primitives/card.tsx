import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Standard card surface, driven entirely by the `--card`/`--border` tokens
// defined in globals.css. Padding is the caller's concern (`className="p-5"`)
// unless the CardHeader/Content/Footer parts are used.
const cardVariants = cva("rounded-xl border border-border bg-card text-card-foreground", {
  variants: {
    variant: {
      /** Structural container: page sections, list wrappers. */
      section: "",
      /** A discrete interactive unit (a tile, a row) — border brightens on hover. */
      item: "transition-colors duration-150 hover:bg-accent/40",
      /** Popovers and floating panels — opaque so content behind never bleeds through. */
      raised: "bg-popover text-popover-foreground shadow-xl",
      /** Interactive tile with an optional hover lift (stat cards, pricing offer card). */
      liquid:
        "aceternity-border-beam transition-[transform,box-shadow] duration-200 ease-out data-[interactive=true]:hover:-translate-y-1 data-[interactive=true]:hover:shadow-xl",
      /** Frosted-glass surface — opt-in, scoped to the Pasargad App Engine routes only. Never the default; every other consumer keeps the flat surface from ARCHITECTURE.md §7. */
      glass: "aceternity-border-beam border-border/40 bg-card/60 backdrop-blur-md",
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
      className={cn("text-sm font-semibold tracking-tight text-card-foreground", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
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
      className={cn("flex items-center gap-2 border-t border-border p-4", className)}
      {...props}
    />
  )
}

export { Card, cardVariants, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
