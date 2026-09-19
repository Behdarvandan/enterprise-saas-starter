/**
 * Locale-aware display helpers for the agency portal. Numbers use Latin
 * digits (see `formatMetricNumber`); dates are UTC so a server render and a
 * browser render produce the same text.
 */
import { formatMetricNumber } from "@/lib/format";

export function formatTokens(locale: string, value: number): string {
  return formatMetricNumber(locale, value);
}

export function formatPercent(locale: string, value: number): string {
  return formatMetricNumber(locale, Math.round(value) / 100, { style: "percent" });
}

/** "Sep 18, 2026" in UTC, or "—" without a timestamp. */
export function formatDateUtc(locale: string, iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
    numberingSystem: "latn",
  }).format(new Date(iso));
}
