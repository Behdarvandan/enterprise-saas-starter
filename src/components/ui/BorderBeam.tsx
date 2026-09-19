import type { ReactNode } from "react";

/**
 * Wraps `children` in a rounded container with a continuously rotating gold
 * sweep along its edge — a pure-CSS "border beam" (no animation library):
 * a conic-gradient layer larger than the container rotates behind a 1px
 * inset content pane, so only a thin sweep of gold is ever visible as a
 * moving border highlight.
 */
export default function BorderBeam({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-interactive p-px ${className ?? ""}`}>
      <div
        className="animate-border-beam absolute inset-[-100%]"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0%, var(--color-primary) 8%, transparent 18%)",
        }}
      />
      <div className="relative rounded-[calc(var(--radius-interactive)-1px)]">{children}</div>
    </div>
  );
}
