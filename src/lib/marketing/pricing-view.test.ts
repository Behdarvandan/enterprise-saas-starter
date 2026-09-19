import { describe, expect, it } from "vitest";
import { getPlans } from "@/lib/plans";
import { SKILL_CATALOG } from "@/lib/skills-catalog";
import { buildPricingView, getRoiPlanCosts, isSkillIncluded } from "./pricing-view";

describe("buildPricingView", () => {
  it("lists the three tiers in order with the enterprise tier as a custom quote", () => {
    const { plans } = buildPricingView("global");

    expect(plans.map((plan) => plan.tier)).toEqual(["starter", "pro", "enterprise"]);
    expect(plans[2]).toMatchObject({ priceLabel: null, href: "/services#quote" });
    expect(plans[0]?.href).toBe("/pricing");
  });

  it.each([
    ["global", /\$20/, /\$50/],
    ["eu", /49\s*€/, /149\s*€/],
  ] as const)("shows the real checkout price for %s", (region, starter, pro) => {
    const { plans } = buildPricingView(region);

    expect(plans[0]?.priceLabel).toMatch(starter);
    expect(plans[1]?.priceLabel).toMatch(pro);
  });

  it("renders the TRY price from the same amount the checkout charges", () => {
    const amount = getPlans("tr")[0]?.checkout;
    if (amount?.kind !== "paytr") throw new Error("expected a PayTR starter plan");

    expect(buildPricingView("tr").plans[0]?.priceLabel).toMatch(/1\.499/);
    expect(amount.amount).toBe(149_900);
  });

  it("marks only the Pro plan as highlighted", () => {
    const { plans } = buildPricingView("global");
    expect(plans.filter((plan) => plan.highlight).map((plan) => plan.tier)).toEqual(["pro"]);
  });

  it("adds the enterprise-only custom row after the real catalog skills", () => {
    const { skills } = buildPricingView("global");

    expect(skills.map((skill) => skill.id)).toEqual([
      ...SKILL_CATALOG.map((skill) => skill.id),
      "custom",
    ]);
  });
});

describe("isSkillIncluded", () => {
  it("unlocks skills from their minimum tier upwards", () => {
    const { skills } = buildPricingView("global");
    const rag = skills.find((skill) => skill.id === "rag_search");
    const calendar = skills.find((skill) => skill.id === "calendar_booking");
    const custom = skills.find((skill) => skill.id === "custom");
    if (!rag || !calendar || !custom) throw new Error("missing skill rows");

    expect(isSkillIncluded("starter", rag)).toBe(true);
    expect(isSkillIncluded("starter", calendar)).toBe(false);
    expect(isSkillIncluded("pro", calendar)).toBe(true);
    expect(isSkillIncluded("pro", custom)).toBe(false);
    expect(isSkillIncluded("enterprise", custom)).toBe(true);
  });
});

describe("getRoiPlanCosts", () => {
  it("nets the real global USD prices against each plan's conversation quota", () => {
    expect(getRoiPlanCosts()).toEqual([
      { conversations: 500, monthlyCostUsd: 20 },
      { conversations: 3_000, monthlyCostUsd: 50 },
    ]);
  });
});
