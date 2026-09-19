/**
 * Locale-aware number formatting for metrics. Always Latin digits: metric
 * values render in a monospace face that has no Persian/Arabic-Indic glyphs,
 * and mixed-script digits would break column alignment in RTL locales.
 */
export function formatMetricNumber(
  locale: string,
  value: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(locale, { numberingSystem: "latn", ...options }).format(value);
}

/** `value` is 0-100 (not a fraction). */
export function formatMetricPercent(locale: string, value: number): string {
  return formatMetricNumber(locale, value / 100, {
    style: "percent",
    maximumFractionDigits: 1,
  });
}

/** Human-readable byte size (B / KB / MB) in the locale's number format, Latin digits. */
export function formatBytes(locale: string, bytes: number): string {
  const [unit, divisor] =
    bytes >= 1024 * 1024 ? (["megabyte", 1024 * 1024] as const)
    : bytes >= 1024 ? (["kilobyte", 1024] as const)
    : (["byte", 1] as const);

  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay: "narrow",
    numberingSystem: "latn",
    maximumFractionDigits: unit === "byte" ? 0 : 1,
  }).format(bytes / divisor);
}

/** Currency amount from minor units (cents), in the locale's number format with Latin digits. */
export function formatMoney(locale: string, cents: number, currency = "USD"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    numberingSystem: "latn",
  }).format(cents / 100);
}
