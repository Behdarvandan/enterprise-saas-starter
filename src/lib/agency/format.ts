// Fixed locale: the same string must render on the server and in the browser,
// or hydration flags a mismatch for users whose browser locale differs.
const tokenFormatter = new Intl.NumberFormat("en-US");

export function formatTokens(value: number): string {
  return tokenFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** "Just now" / "5m ago" / "3h ago" / "2d ago", or "—" without a timestamp. */
export function formatRelativeTime(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "—";
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}

/** "Sep 18, 2026" in UTC, so server and browser render the same text. */
export function formatDateUtc(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" });
}
