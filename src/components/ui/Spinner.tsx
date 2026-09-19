import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  /** Accessible label; omit when the surrounding control already announces the state. */
  label?: string;
}

/** Indeterminate progress indicator for waits the UI cannot measure. */
export default function Spinner({ className, label }: SpinnerProps) {
  return (
    <span role={label ? "status" : undefined} className="inline-flex">
      <Loader2 aria-hidden className={cn("size-4 animate-spin text-current", className)} />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
