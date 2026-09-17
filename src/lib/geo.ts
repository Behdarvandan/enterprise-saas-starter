import { headers } from "next/headers";

export type PricingRegion = "tr" | "eu" | "global";

// EU-27 ISO 3166-1 alpha-2 codes. Deliberately excludes GB (not in the EU,
// uses GBP not EUR) and non-EU EEA members (CH/NO/IS/LI) — the brief only
// specifies a DE/EU eurozone bucket, so anything not explicitly EU falls
// through to the Global/USD bucket rather than guessing at EUR pricing for
// adjacent markets.
const EU_COUNTRY_CODES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
]);

/**
 * Resolves the visitor's pricing region from Vercel's `x-vercel-ip-country`
 * header (injected automatically at the edge on every request — no geo-IP
 * dependency needed). Region is independent of UI locale: a `de`-locale
 * visitor from Turkey still sees TR/₺ pricing in German copy.
 *
 * Server-only — call from a Server Component or Route Handler.
 */
export async function getPricingRegion(): Promise<PricingRegion> {
  if (process.env.NODE_ENV !== "production" && process.env.PRICING_REGION_OVERRIDE) {
    const override = process.env.PRICING_REGION_OVERRIDE.trim().toLowerCase();
    if (override === "tr" || override === "eu" || override === "global") {
      return override;
    }
  }

  const countryCode = (await headers()).get("x-vercel-ip-country");
  if (countryCode === "TR") return "tr";
  if (countryCode && EU_COUNTRY_CODES.has(countryCode)) return "eu";
  return "global";
}
