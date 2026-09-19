"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger offset in ms for siblings revealed together. */
  delay?: number;
}

/**
 * Fades + lifts its children in once, when scrolled into view. Content is
 * visible from the first server render (no JS = no hidden sections): the
 * hidden state is only applied after mount, and never under reduced motion.
 */
export default function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // "ssr" renders visible; "hidden" is armed after mount; "shown" plays the transition.
  const [phase, setPhase] = useState<"ssr" | "hidden" | "shown">("ssr");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const inView = node.getBoundingClientRect().top < window.innerHeight;
    if (reduceMotion || inView || typeof IntersectionObserver === "undefined") return;

    setPhase("hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setPhase("shown");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={phase === "shown" && delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        phase === "hidden" && "translate-y-3 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
