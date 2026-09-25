"use client"

import * as React from "react"
import { X } from "lucide-react"
import { useTranslations } from "next-intl"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Dialog as SheetPrimitive } from "radix-ui"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close

// `start`/`end` follow the reading direction, so a drawer opens from the
// correct edge in RTL locales without per-locale branching.
const sheetVariants = cva(
  "fixed z-50 flex flex-col gap-4 p-5 shadow-2xl shadow-black/40 outline-none duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        start:
          "inset-y-0 start-0 h-full w-80 max-w-[85vw] border-e data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left rtl:data-[state=open]:slide-in-from-right rtl:data-[state=closed]:slide-out-to-right",
        end: "inset-y-0 end-0 h-full w-full border-s data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right sm:max-w-lg rtl:data-[state=open]:slide-in-from-left rtl:data-[state=closed]:slide-out-to-left",
      },
      variant: {
        /** Opaque panel — the existing look, for dense content that shouldn't show what's behind it. */
        default: "border-slate-800 bg-slate-900 text-slate-100",
        /** Liquid Glass drawer — frosted material, for the mobile nav sheet. */
        liquid: "liquid-surface border-transparent text-foreground",
      },
    },
    defaultVariants: { side: "end", variant: "default" },
  }
)

function SheetContent({
  side,
  variant,
  className,
  children,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & VariantProps<typeof sheetVariants>) {
  const t = useTranslations("ui")

  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(sheetVariants({ side, variant }), className)}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute end-4 top-4 flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60">
          <X aria-hidden className="size-4" />
          <span className="sr-only">{t("close")}</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      className={cn("text-base font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription }
