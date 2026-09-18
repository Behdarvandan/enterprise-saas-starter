import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdministeredAgency } from "@/lib/agency/admin";
import { DEFAULT_ENABLED_SKILLS, PLAN_ENABLED_SKILLS } from "@/lib/payment/handlers";
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

  return (data?.plan_id && PLAN_ENABLED_SKILLS[data.plan_id]) || DEFAULT_ENABLED_SKILLS;
}

/** Requested skills that are not in the allowed set (empty means all good). */
export function findDisallowedSkills(requested: string[], allowed: string[]): string[] {
  return requested.filter((skill) => !allowed.includes(skill));
}

/** Reads `crew_config.enabled_skills` out of a `tenant_configs.config` blob. */
export function readEnabledSkills(config: unknown): string[] | null {
  if (!config || typeof config !== "object") return null;
  const crewConfig = (config as { crew_config?: unknown }).crew_config;
  if (!crewConfig || typeof crewConfig !== "object") return null;
  const skills = (crewConfig as { enabled_skills?: unknown }).enabled_skills;
  return Array.isArray(skills) && skills.every((skill) => typeof skill === "string")
    ? (skills as string[])
    : null;
}
