import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en", "de", "fa"],
  defaultLocale: "en",
  // English stays unprefixed ("/pricing"), every other locale is prefixed
  // ("/tr/pricing", "/de/pricing", "/fa/pricing").
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

/** Locales that read right-to-left. */
export const RTL_LOCALES: readonly Locale[] = ["fa"];

export function isRtlLocale(locale: string): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}
