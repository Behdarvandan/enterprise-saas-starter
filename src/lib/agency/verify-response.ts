import type { CnameStatus } from "@/lib/agency/cname";

export interface CnameVerifyResult {
  status: CnameStatus;
  domain: string;
  target: string;
  /** CNAME targets the resolver currently returns for the domain. */
  records: string[];
  /** ISO timestamp of the check, as recorded by the server. */
  checkedAt: string | null;
}

const STATUSES: readonly string[] = ["pending", "active", "failed"];

/**
 * Narrows the untrusted JSON of `POST /api/agency/cname/verify`. Returns
 * `null` for anything that isn't the documented success shape, so the UI
 * never renders an unknown status. `records`/`checkedAt` are optional so a
 * response from before they existed still parses.
 */
export function parseVerifyResponse(body: unknown): CnameVerifyResult | null {
  if (!body || typeof body !== "object") return null;
  const { status, domain, target, records, checkedAt } = body as Record<string, unknown>;
  if (typeof status !== "string" || !STATUSES.includes(status)) return null;
  if (typeof domain !== "string" || typeof target !== "string") return null;

  return {
    status: status as CnameStatus,
    domain,
    target,
    records: Array.isArray(records) ? records.filter((r): r is string => typeof r === "string") : [],
    checkedAt: typeof checkedAt === "string" ? checkedAt : null,
  };
}

/** Error codes `POST /api/agency/cname/verify` may return (`agency.branding.dns.errors.<code>`). */
export type VerifyErrorCode = "rate_limited" | "dns_unreachable" | "not_found" | "no_domain" | "generic";

const KNOWN_CODES: readonly string[] = ["rate_limited", "dns_unreachable", "not_found", "no_domain"];

/** The route's machine `code`, or one inferred from the HTTP status. */
export function readVerifyErrorCode(body: unknown, httpStatus: number): VerifyErrorCode {
  if (body && typeof body === "object") {
    const { code } = body as Record<string, unknown>;
    if (typeof code === "string" && KNOWN_CODES.includes(code)) return code as VerifyErrorCode;
  }
  if (httpStatus === 429) return "rate_limited";
  if (httpStatus === 502) return "dns_unreachable";
  return "generic";
}

/** `agencies.cname_status` is a plain text column; anything unexpected reads as `pending`. */
export function normalizeCnameStatus(value: string): CnameStatus {
  return STATUSES.includes(value) ? (value as CnameStatus) : "pending";
}
