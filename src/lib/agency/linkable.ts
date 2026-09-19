import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdministeredAgency } from "@/lib/agency/admin";
import type { Database } from "@/types/database";

export interface LinkableOrganization {
  id: string;
  name: string;
  slug: string;
}

/**
 * Organizations the caller may attach to their agency: ones they *own* (the
 * `link_agency_tenant` RPC requires ownership), that are not the agency's own
 * master organization and not already linked to any agency.
 *
 * Read under the caller's RLS — memberships and organizations are only ever
 * visible to their own members, so this cannot reveal anyone else's
 * organizations. The RPC re-checks every rule; this only powers the picker.
 */
export async function getLinkableOrganizations(
  supabase: SupabaseClient<Database>,
  userId: string,
  agency: Pick<AdministeredAgency, "master_tenant_id">,
): Promise<LinkableOrganization[]> {
  const { data: owned, error } = await supabase
    .from("memberships")
    .select("organizations ( id, name, slug )")
    .eq("user_id", userId)
    .eq("role", "owner");
  if (error) throw error;

  const candidates = (owned ?? [])
    .flatMap((row) => (row.organizations ? [row.organizations] : []))
    .filter((organization) => organization.id !== agency.master_tenant_id);
  if (candidates.length === 0) return [];

  // `unique(tenant_id)`: an organization belongs to at most one agency.
  const { data: taken, error: takenError } = await supabase
    .from("agency_tenants")
    .select("tenant_id")
    .in("tenant_id", candidates.map((organization) => organization.id));
  if (takenError) throw takenError;

  const linked = new Set((taken ?? []).map((row) => row.tenant_id));
  return candidates
    .filter((organization) => !linked.has(organization.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}
