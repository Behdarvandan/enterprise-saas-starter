import { resolvePlanTier, tierIncludes, type PlanTier } from "@/lib/plans";

/**
 * The Ops Crew skills a tenant can toggle (`crew_config.enabled_skills`
 * ids). Ids must match pasargad-core's `packages/graph/tools.py`. Display
 * copy lives in the `skills.catalog.<id>` message keys, not here.
 */
export const SKILL_IDS = ["rag_search", "calendar_booking"] as const;
export type SkillId = (typeof SKILL_IDS)[number];

export interface SkillDefinition {
  id: SkillId;
  /** Lowest plan tier that unlocks the skill. */
  minTier: PlanTier;
  /** Whether the tenant can tune the skill beyond on/off. */
  configurable: boolean;
}

export const SKILL_CATALOG: readonly SkillDefinition[] = [
  { id: "rag_search", minTier: "starter", configurable: true },
  { id: "calendar_booking", minTier: "pro", configurable: false },
];

export function isSkillId(value: string): value is SkillId {
  return (SKILL_IDS as readonly string[]).includes(value);
}

/** Skills a plan tier unlocks — the ceiling a tenant can never toggle past. */
export const PLAN_ENABLED_SKILLS: Record<PlanTier, SkillId[]> = {
  starter: skillsForTier("starter"),
  pro: skillsForTier("pro"),
  enterprise: skillsForTier("enterprise"),
};

export const DEFAULT_ENABLED_SKILLS: SkillId[] = PLAN_ENABLED_SKILLS.starter;

function skillsForTier(tier: PlanTier): SkillId[] {
  return SKILL_CATALOG.filter((skill) => tierIncludes(tier, skill.minTier)).map(
    (skill) => skill.id,
  );
}

/**
 * Skills unlocked by an `organizations.plan_id` value. That column holds a
 * Stripe price id (or nothing for PayTR/unset), so it is resolved to a tier
 * first — indexing the tier map with the raw id would always miss.
 */
export function getPlanSkills(planId: string | null | undefined): SkillId[] {
  return PLAN_ENABLED_SKILLS[resolvePlanTier(planId)];
}
