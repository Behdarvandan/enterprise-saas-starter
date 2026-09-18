/**
 * Maps the agency-portal RPCs' error keys (the `raise exception '<key>'`
 * message in supabase/migrations/20261122000000_phase4_3_agency_portal.sql)
 * to user-facing copy. Unknown errors get a generic message so raw database
 * text never reaches the UI.
 */
const RPC_ERROR_MESSAGES: Record<string, string> = {
  not_agency_admin: "You don't have permission to manage this agency.",
  not_tenant_owner: "You can only link organizations that you own.",
  tenant_is_master: "Your agency's own organization can't be added as a tenant.",
  tenant_already_linked: "That organization is already linked to an agency.",
  tenant_not_in_agency: "That tenant isn't linked to your agency.",
  quota_pool_exceeded:
    "That would exceed your token pool. Enter a lower amount, or ask for a larger pool.",
  quota_below_consumed:
    "That is below what this tenant has already used. Enter at least the used amount.",
  invalid_quota: "Enter a valid number of tokens.",
  invalid_name: "Enter a name for the tenant.",
  invalid_slug: "Use lowercase letters, numbers and single hyphens, e.g. acme-repairs.",
  slug_taken: "That slug is already taken. Try another one.",
};

export const GENERIC_AGENCY_ERROR = "Something went wrong. Please try again.";

export function mapAgencyRpcError(error: { message?: string } | null | undefined): string {
  const key = error?.message ?? "";
  return RPC_ERROR_MESSAGES[key] ?? GENERIC_AGENCY_ERROR;
}

/** Whether the error is one the portal deliberately raises (vs. an unexpected failure worth logging). */
export function isKnownAgencyRpcError(error: { message?: string } | null | undefined): boolean {
  return Boolean(error?.message && error.message in RPC_ERROR_MESSAGES);
}
