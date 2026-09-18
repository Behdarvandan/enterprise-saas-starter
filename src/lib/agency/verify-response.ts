import type { CnameStatus } from "@/lib/agency/cname";

export interface CnameVerifyResult {
  status: CnameStatus;
  domain: string;
  target: string;
}

const STATUSES: readonly string[] = ["pending", "active", "failed"];

/**
 * Narrows the untrusted JSON of `POST /api/agency/cname/verify`. Returns
 * `null` for anything that isn't the documented success shape, so the UI
 * never renders an unknown status.
 */
export function parseVerifyResponse(body: unknown): CnameVerifyResult | null {
  if (!body || typeof body !== "object") return null;
  const { status, domain, target } = body as Record<string, unknown>;
  if (typeof status !== "string" || !STATUSES.includes(status)) return null;
  if (typeof domain !== "string" || typeof target !== "string") return null;
  return { status: status as CnameStatus, domain, target };
}

/** The route's `{ error }` message, or a fallback keyed on the HTTP status. */
export function readVerifyError(body: unknown, httpStatus: number): string {
  if (body && typeof body === "object") {
    const { error } = body as Record<string, unknown>;
    if (typeof error === "string" && error) return error;
  }
  return httpStatus === 429
    ? "Too many attempts. Please wait a minute and try again."
    : "Couldn't verify the domain right now. Please try again.";
}

/** `agencies.cname_status` is a plain text column; anything unexpected reads as `pending`. */
export function normalizeCnameStatus(value: string): CnameStatus {
  return STATUSES.includes(value) ? (value as CnameStatus) : "pending";
}
