'use client';

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Button } from "@/core/ui/primitives/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

/**
 * Light/dark switch built on the plain Button primitive. Renders the "dark"
 * icon state before mount to match the server-rendered markup (avoids a
 * hydration mismatch, since `resolvedTheme` is only known client-side) and
 * swaps in the real icon once mounted.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const t = useTranslations("shell");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = !mounted || resolvedTheme !== "light";
  const label = isDark ? t("switchToLight") : t("switchToDark");

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("rounded-full", className)}
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Moon className="size-4" aria-hidden />
      ) : (
        <Sun className="size-4" aria-hidden />
      )}
    </Button>
  );
}
