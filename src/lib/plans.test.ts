import { describe, expect, it } from "vitest";
import { getAllPlans, getPlans } from "./plans";

describe("getPlans", () => {
  it("returns starter/pro/enterprise tiers for every region", () => {
    for (const region of ["tr", "eu", "global"] as const) {
      const plans = getPlans(region);
      expect(plans.map((plan) => plan.tier)).toEqual(["starter", "pro", "enterprise"]);
      expect(plans.every((plan) => plan.region === region)).toBe(true);
    }
  });

  it("prices the TR region in TRY via PayTR", () => {
    const [starter, pro] = getPlans("tr");
    expect(starter.checkout).toEqual({ kind: "paytr", amount: 149_900, currency: "TRY" });
    expect(pro.checkout).toEqual({ kind: "paytr", amount: 399_900, currency: "TRY" });
  });

  it("prices the EU region in EUR via Stripe", () => {
    const [starter, pro] = getPlans("eu");
    expect(starter.checkout.kind).toBe("stripe");
    expect(pro.checkout.kind).toBe("stripe");
    if (starter.checkout.kind === "stripe" && pro.checkout.kind === "stripe") {
      expect(starter.checkout.currency).toBe("EUR");
      expect(starter.checkout.amount).toBe(4_900);
      expect(pro.checkout.amount).toBe(14_900);
    }
  });

  it("prices the Global region in USD via Stripe", () => {
    const [starter, pro] = getPlans("global");
    if (starter.checkout.kind === "stripe" && pro.checkout.kind === "stripe") {
      expect(starter.checkout.currency).toBe("USD");
      expect(starter.checkout.amount).toBe(2_000);
      expect(pro.checkout.amount).toBe(5_000);
    }
  });

  it("makes Enterprise contact-only in every region, never checkout-able", () => {
    for (const region of ["tr", "eu", "global"] as const) {
      const enterprise = getPlans(region).find((plan) => plan.tier === "enterprise");
      expect(enterprise?.checkout.kind).toBe("contact");
    }
  });
});

describe("getAllPlans", () => {
  it("flattens all three regions into 9 plans", () => {
    expect(getAllPlans()).toHaveLength(9);
  });
});
