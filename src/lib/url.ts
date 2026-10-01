import { headers } from "next/headers";

/** RFC 1123 hostname (optionally with a port) or `localhost[:port]`. */
const HOST_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*(?::\d{1,5})?$/i;

/**
 * Returns the absolute base URL of the current request.
 *
 * Links built from this end up in emails (password reset, invitations) and
 * payment redirects, so a spoofed `Host`/`X-Forwarded-Host` header must not be
 * able to point them at an attacker's domain. Resolution order:
 *
 * 1. `APP_URL` (explicit, trusted) — set this in production.
 * 2. The request's forwarded host/proto, but only when they are well-formed;
 *    anything else falls back to localhost.
 */
export async function getBaseUrl(): Promise<string> {
  const configured = process.env.APP_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" || url.protocol === "http:") return url.origin;
    } catch {
      console.error("[url] APP_URL is not a valid absolute URL; ignoring it.");
    }
  }

  const headersList = await headers();
  const rawHost =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000";
  // A proxy chain may append multiple hosts/protos ("a.com, b.com"): use the first.
  const host = rawHost.split(",")[0]?.trim() ?? "";
  const rawProto = headersList.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();

  if (!HOST_PATTERN.test(host)) return "http://localhost:3000";

  const proto = rawProto === "https" ? "https" : "http";
  return `${proto}://${host}`;
}
