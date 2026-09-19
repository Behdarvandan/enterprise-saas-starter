"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { skillListSchema } from "@/lib/agency/schemas";
import { logAudit } from "@/lib/audit";
import { requireMembershipResult } from "@/lib/auth";
import { applyTenantConfigUpdate, applyTenantEnabledSkills } from "@/lib/payment/handlers";
import { buildSkillConfigSchema, getSkillConfig } from "@/lib/skills/skill-config";
import { withSkillConfig } from "@/lib/skills/tenant-config";
import { getPlanSkills, isSkillId } from "@/lib/skills-catalog";
import { canManageMembers } from "@/lib/team";

export interface SkillActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Updates the caller's organization's active Ops Crew skills
 * (tenant_configs.crew_config.enabled_skills), clamped to whatever the
 * organization's plan unlocks so a tenant can never self-upgrade past it.
 */
export async function updateEnabledSkills(skills: string[]): Promise<SkillActionResult> {
  const t = await getTranslations("dashboard.skills.errors");

  const auth = await requireMembershipResult();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user, membership } = auth;

  if (!canManageMembers(membership.role)) return { error: t("forbidden") };

  const parsed = skillListSchema.safeParse(skills);
  if (!parsed.success) return { error: t("invalid") };

  const { data: organization } = await supabase
    .from("organizations")
    .select("plan_id")
    .eq("id", membership.organizationId)
    .maybeSingle();

  const allowed: string[] = getPlanSkills(organization?.plan_id);
  const disallowed = parsed.data.filter((skill) => !allowed.includes(skill));
  if (disallowed.length > 0) return { error: t("planLimit", { skills: disallowed.join(", ") }) };

  const { error } = await applyTenantEnabledSkills(membership.organizationId, parsed.data);
  if (error) return { error: t("saveFailed") };

  await logAudit({
    action: "skills.updated",
    organizationId: membership.organizationId,
    actorId: user.id,
    targetTable: "tenant_configs",
    metadata: { enabled_skills: parsed.data },
  });

  revalidatePath("/dashboard/skills");
  return { success: true };
}

/**
 * Saves one skill's settings. Values are validated against the schema built
 * from the skill's descriptor (strict: unknown keys are rejected), so this can
 * only ever write the whitelisted keys — never backend-owned ones.
 */
export async function updateSkillConfig(
  skillId: string,
  values: unknown,
): Promise<SkillActionResult> {
  const t = await getTranslations("dashboard.skills.errors");

  const auth = await requireMembershipResult();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user, membership } = auth;

  if (!canManageMembers(membership.role)) return { error: t("forbidden") };
  if (!isSkillId(skillId)) return { error: t("unknownSkill") };

  const definition = getSkillConfig(skillId);
  if (!definition) return { error: t("notConfigurable") };

  const { data: organization } = await supabase
    .from("organizations")
    .select("plan_id")
    .eq("id", membership.organizationId)
    .maybeSingle();
  if (!getPlanSkills(organization?.plan_id).includes(skillId)) {
    return { error: t("planLimit", { skills: skillId }) };
  }

  const parsed = buildSkillConfigSchema(definition.fields).safeParse(values);
  if (!parsed.success) return { error: t("invalidConfig") };

  const { error } = await applyTenantConfigUpdate(membership.organizationId, (config) =>
    withSkillConfig(config, skillId, parsed.data as Record<string, number>),
  );
  if (error) return { error: t("saveFailed") };

  await logAudit({
    action: "skills.config_updated",
    organizationId: membership.organizationId,
    actorId: user.id,
    targetTable: "tenant_configs",
    metadata: { skill: skillId, values: parsed.data as Record<string, number> },
  });

  revalidatePath("/dashboard/skills");
  return { success: true };
}
