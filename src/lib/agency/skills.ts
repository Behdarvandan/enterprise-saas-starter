import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdministeredAgency } from "@/lib/agency/admin";
import { getPlanSkills } from "@/lib/skills-catalog";
import type { Database } from "@/types/database";

/**
 * Skills an agency may hand out to its tenants: whatever the agency's *own*
 * (master organization) plan unlocks, so an agency can never distribute more
 * than it pays for. Same plan -> skills mapping the tenant Skills page uses.
 */
export async function getAllowedAgencySkills(
  supabase: SupabaseClient<Database>,
  agency: Pick<AdministeredAgency, "master_tenant_id">,
): Promise<string[]> {
  const { data } = await supabase
    .from("organizations")
    .select("plan_id")
    .eq("id", agency.master_tenant_id)
    .maybeSingle();

  return getPlanSkills(data?.plan_id);
}

/** Requested skills that are not in the allowed set (empty means all good). */
export function findDisallowedSkills(requested: string[], allowed: string[]): string[] {
  return requested.filter((skill) => !allowed.includes(skill));
}

export { readEnabledSkills } from "@/lib/skills/tenant-config";
