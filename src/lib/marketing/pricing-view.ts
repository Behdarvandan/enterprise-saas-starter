import { PLAN_LIMITS, getPlans, tierIncludes, type PlanLimits, type PlanTier } from "@/lib/plans";
import type { PricingRegion } from "@/lib/geo";
import type { RoiPlanCost } from "@/lib/marketing/roi";
import { SKILL_CATALOG, type SkillId } from "@/lib/skills-catalog";
import { formatPlanPrice } from "@/lib/utils";

/** Serializable plan card data for the landing page. */
export interface PricingPlanView {
  tier: PlanTier;
  highlight: boolean;
  /** Region-formatted price, or null for the custom-quote tier. */
  priceLabel: string | null;
  limits: PlanLimits;
  /** Where the plan's call to action leads. */
  href: string;
}

/** A row of the skill matrix; `custom` is the sales-led Enterprise capability. */
export interface SkillRowView {
  id: SkillId | "custom";
  minTier: PlanTier;
}

export interface PricingView {
  plans: PricingPlanView[];
  skills: SkillRowView[];
}

/**
 * Landing pricing derived from the same `getPlans()` data the checkout uses,
 * so the price a visitor reads is the price they pay. The plan's display
 * strings are not reused: their period and copy are region-bound, not
 * locale-bound.
 */
export function buildPricingView(region: PricingRegion): PricingView {
  const plans = getPlans(region).map((plan): PricingPlanView => {
    const paid = plan.checkout.kind === "contact" ? null : plan.checkout;
    return {
      tier: plan.tier,
      highlight: plan.highlight === true,
      priceLabel: paid ? formatPlanPrice(paid.amount, paid.currency) : null,
      limits: PLAN_LIMITS[plan.tier],
      href: paid ? "/pricing" : "/services#quote",
    };
  });

  const skills: SkillRowView[] = [
    ...SKILL_CATALOG.map((skill): SkillRowView => ({ id: skill.id, minTier: skill.minTier })),
    { id: "custom", minTier: "enterprise" },
  ];

  return { plans, skills };
}

export function isSkillIncluded(tier: PlanTier, skill: SkillRowView): boolean {
  return tierIncludes(tier, skill.minTier);
}

/**
 * USD plans the ROI calculator nets off its savings, from the same global
 * plan data the checkout charges. Quota-less tiers (Enterprise) are skipped:
 * they have no listed price.
 */
export function getRoiPlanCosts(): RoiPlanCost[] {
  return getPlans("global").flatMap((plan) => {
    const { conversations } = PLAN_LIMITS[plan.tier];
    if (plan.checkout.kind !== "stripe" || plan.checkout.currency !== "USD" || conversations === null) {
      return [];
    }
    return [{ conversations, monthlyCostUsd: plan.checkout.amount / 100 }];
  });
}
