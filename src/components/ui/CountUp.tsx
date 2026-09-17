"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** Final numeric value to animate to. */
  value: number;
  /** Formats the in-progress value for display (defaults to a rounded integer). */
  format?: (value: number) => string;
  durationMs?: number;
  className?: string;
}

/**
 * Animates a number counting up from 0 once it scrolls into view — brief
 * §7: "KPI/metric numbers count up from 0 on load, never appear instantly."
 * Runs once per mount (re-triggering on every re-render/refresh would be
 * distracting on pages that call `router.refresh()` often, like the admin
 * dashboard).
 */
export default function CountUp({
  value,
  format = (v) => Math.round(v).toLocaleString(),
  durationMs = 900,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated.current) return;
        hasAnimated.current = true;

        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min((now - start) / durationMs, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(value * eased);
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate once per mount, not on every `value` update
  }, []);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}
