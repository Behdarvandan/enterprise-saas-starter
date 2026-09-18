"use server";

import { revalidatePath } from "next/cache";
import { requireMembershipResult } from "@/lib/auth";
import { canManageMembers } from "@/lib/team";
import {
  applyTenantEnabledSkills,
  DEFAULT_ENABLED_SKILLS,
  PLAN_ENABLED_SKILLS,
} from "@/lib/payment/handlers";

/**
 * Updates the caller's organization's active Ops Crew skills
 * (tenant_configs.crew_config.enabled_skills), clamped to whatever the
 * organization's current plan unlocks (PLAN_ENABLED_SKILLS) so a tenant can
 * never self-upgrade past their plan from this form.
 */
export async function updateEnabledSkills(
  skills: string[],
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireMembershipResult();
  if ("error" in auth) return auth;
  const { supabase, membership } = auth;

  if (!canManageMembers(membership.role)) {
    return { error: "Only owners and admins can manage skills." };
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("plan_id")
    .eq("id", membership.organizationId)
    .maybeSingle();

  const allowedSkills =
    (organization?.plan_id && PLAN_ENABLED_SKILLS[organization.plan_id]) ||
    DEFAULT_ENABLED_SKILLS;

  const disallowed = skills.filter((skill) => !allowedSkills.includes(skill));
  if (disallowed.length > 0) {
    return {
      error: `Your current plan doesn't include: ${disallowed.join(", ")}.`,
    };
  }

  const { error } = await applyTenantEnabledSkills(
    membership.organizationId,
    skills,
  );
  if (error) return { error };

  revalidatePath("/dashboard/skills");
  return { success: true };
}
