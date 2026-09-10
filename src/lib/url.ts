import { headers } from "next/headers";

/**
 * Returns the absolute base URL of the current request, derived from the
 * request headers. Falls back to localhost for local development.
 */
export async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
