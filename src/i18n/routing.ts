import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "tr"],
  defaultLocale: "en",
  // English stays unprefixed ("/pricing"), Turkish is prefixed ("/tr/pricing")
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
