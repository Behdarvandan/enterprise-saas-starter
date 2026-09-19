import { cn } from "cn"

/**
 * Loading placeholder — a slate shimmer sweep instead of a flat pulse, so a
 * page waiting on data reads as "working" without competing with content.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "animate-shimmer bg-size-[200%_100%] rounded-md bg-[linear-gradient(110deg,var(--color-slate-800)_8%,var(--color-slate-700)_18%,var(--color-slate-800)_33%)] opacity-60",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
