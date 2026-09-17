import { cn } from "cn"

/**
 * Gold-tinted shimmer, not a generic gray pulse (brief §7) — a moving
 * gradient sweep across the muted surface color, tinted with `--color-gold`.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-shimmer bg-size-[200%_100%] rounded-md bg-[linear-gradient(110deg,var(--color-muted)_8%,color-mix(in_oklab,var(--color-gold)_20%,var(--color-muted))_18%,var(--color-muted)_33%)]",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
