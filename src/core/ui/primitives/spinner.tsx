import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "cn"

interface SpinnerProps extends React.ComponentProps<"span"> {
  /** Accessible label; omit when the surrounding control already announces the state. */
  label?: string
}

/** Indeterminate progress indicator for waits the UI cannot measure. */
function Spinner({ className, label, ...props }: SpinnerProps) {
  return (
    <span
      data-slot="spinner"
      role={label ? "status" : undefined}
      className="inline-flex"
      {...props}
    >
      <Loader2 aria-hidden className={cn("size-4 animate-spin text-current", className)} />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  )
}

export { Spinner }
