"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Client-side theme provider wrapper around `next-themes`.
 *
 * Configured at the call site in the root layout with:
 *   - attribute="class"    -> toggles a `.dark` class on <html>
 *   - defaultTheme="system" -> follows the OS preference by default
 *   - enableSystem          -> allows the "system" theme to be selected
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
