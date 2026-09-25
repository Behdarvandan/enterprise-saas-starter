import { cn } from "@/lib/utils";

interface AmbientGlowProps {
  className?: string;
  /** Where the glow's center sits within its positioned container. */
  position?: "top" | "bottom" | "center";
  /** Any valid CSS color, including alpha. Defaults to the brand violet. */
  color?: string;
}

const POSITION_ORIGIN: Record<NonNullable<AmbientGlowProps["position"]>, string> = {
  top: "50% 0%",
  bottom: "50% 100%",
  center: "50% 50%",
};

/**
 * Soft radial-gradient backdrop glow — the decorative wash already used ad
 * hoc behind Hero/FinalCta, extracted into one component so every section
 * that wants ambient depth shares the same recipe instead of hand-rolling
 * the gradient string again. Purely decorative: no hooks, safe in Server
 * Components. Place inside a `relative` (or `isolate`) positioned parent.
 */
export function AmbientGlow({ className, position = "top", color = "rgba(124,58,237,0.22)" }: AmbientGlowProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10", className)}
      style={{
        background: `radial-gradient(ellipse 60% 60% at ${POSITION_ORIGIN[position]}, ${color}, transparent 70%)`,
      }}
    />
  );
}
