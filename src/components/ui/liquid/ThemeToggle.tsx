"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { LiquidButton } from "@/components/ui/liquid/LiquidButton";

interface ThemeToggleProps {
  className?: string;
}

/**
 * Light/dark switch built on LiquidButton. Renders the "dark" icon state
 * before mount to match the server-rendered markup (avoids a hydration
 * mismatch, since `resolvedTheme` is only known client-side) and swaps in
 * the real icon once mounted.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const t = useTranslations("shell");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = !mounted || resolvedTheme !== "light";
  const label = isDark ? t("switchToLight") : t("switchToDark");

  return (
    <LiquidButton
      type="button"
      size="icon"
      className={cn("rounded-full", className)}
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="t-icon-swap" data-state={isDark ? "a" : "b"}>
        <Moon data-icon="a" className="t-icon size-4" aria-hidden />
        <Sun data-icon="b" className="t-icon size-4" aria-hidden />
      </span>
    </LiquidButton>
  );
}
