"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

/**
 * Client-side toggle that switches between the `light` and `dark` themes.
 *
 * Renders a placeholder icon until the component is mounted to avoid a
 * hydration mismatch: `resolvedTheme` is `undefined` during the first
 * server/client render pass.
 *
 * Cosmetic only: `[locale]/layout.tsx` sets `forcedTheme="dark"` on
 * `ThemeProvider` app-wide, so `resolvedTheme` never actually changes —
 * there is no light palette in `globals.css` to switch to. The icon still
 * flips on click so the control doesn't look broken, but it does not
 * change what's rendered.
 */
export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-control text-zinc-400 transition-colors hover:text-zinc-100",
        className,
      )}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
