/**
 * The agency-portal RPCs' error keys (the `raise exception '<key>'` message in
 * supabase/migrations/20261122000000_phase4_3_agency_portal.sql). Each key is
 * also a message key under `agency.errors`, so the Server Actions translate
 * them per request locale. Unknown errors collapse to `generic`, so raw
 * database text never reaches the UI.
 */
export const AGENCY_RPC_ERROR_KEYS = [
  "not_agency_admin",
  "not_tenant_owner",
  "tenant_is_master",
  "tenant_already_linked",
  "tenant_not_in_agency",
  "quota_pool_exceeded",
  "quota_below_consumed",
  "invalid_quota",
  "invalid_name",
  "invalid_slug",
  "slug_taken",
] as const;

export type AgencyRpcErrorKey = (typeof AGENCY_RPC_ERROR_KEYS)[number];
export type AgencyErrorKey = AgencyRpcErrorKey | "generic";

export const GENERIC_AGENCY_ERROR = "generic" satisfies AgencyErrorKey;

function isRpcKey(value: string): value is AgencyRpcErrorKey {
  return (AGENCY_RPC_ERROR_KEYS as readonly string[]).includes(value);
}

/** The `agency.errors` message key for an RPC failure. */
export function mapAgencyRpcError(error: { message?: string } | null | undefined): AgencyErrorKey {
  const key = error?.message ?? "";
  return isRpcKey(key) ? key : GENERIC_AGENCY_ERROR;
}

/** Whether the error is one the portal deliberately raises (vs. an unexpected failure worth logging). */
export function isKnownAgencyRpcError(error: { message?: string } | null | undefined): boolean {
  return Boolean(error?.message && isRpcKey(error.message));
}
