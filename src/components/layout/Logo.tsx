import { cn } from "@/lib/utils";

/**
 * Abstract circular/dotted motif referenced in the brand brief §1.3 —
 * concentric circles + four cardinal dots, echoing the Simurgh emblem's
 * border pattern without depicting the bird itself. Monochrome, inherits
 * `currentColor` so it can sit on any accent-colored surface.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="13.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="3.5" r="1.75" fill="currentColor" />
      <circle cx="16" cy="28.5" r="1.75" fill="currentColor" />
      <circle cx="3.5" cy="16" r="1.75" fill="currentColor" />
      <circle cx="28.5" cy="16" r="1.75" fill="currentColor" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  /** Optional line rendered under the wordmark (e.g. "Admin", "Client portal"). */
  subtitle?: string;
}

/** Shared wordmark + motif — replaces the old per-file "Nimbus" markup. */
export default function Logo({ className, subtitle }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground">
        <LogoMark className="h-4 w-4" />
      </div>
      <div>
        <span className="block font-serif text-sm font-semibold tracking-tight text-ink-primary">
          Pasargad
        </span>
        {subtitle ? <span className="block text-xs text-ink-muted">{subtitle}</span> : null}
      </div>
    </div>
  );
}
