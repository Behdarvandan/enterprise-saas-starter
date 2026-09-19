import { describe, expect, it } from "vitest";
import {
  AGENT_RANGE,
  DEFAULT_ASSUMPTIONS,
  VOLUME_RANGE,
  computeRoi,
  type RoiPlanCost,
} from "./roi";

const PLANS: RoiPlanCost[] = [
  { conversations: 3_000, monthlyCostUsd: 50 },
  { conversations: 500, monthlyCostUsd: 20 },
];

describe("computeRoi", () => {
  it("nets the smallest covering plan off the gross savings", () => {
    const result = computeRoi({ monthlyVolume: 500, agentCount: 3 }, PLANS);

    // 500 conv x 6 min = 50 h; 70% automated = 35 h; x $14 = $490.
    expect(result.hoursSaved).toBeCloseTo(35);
    expect(result.grossSavingsUsd).toBeCloseTo(490);
    expect(result.platformCostUsd).toBe(20);
    expect(result.netSavingsUsd).toBeCloseTo(470);
  });

  it("picks the next plan up once the volume passes a plan's quota", () => {
    const result = computeRoi({ monthlyVolume: 600, agentCount: 3 }, PLANS);
    expect(result.platformCostUsd).toBe(50);
  });

  it("reports gross savings when no listed plan covers the volume", () => {
    const result = computeRoi({ monthlyVolume: 10_000, agentCount: 20 }, PLANS);

    expect(result.platformCostUsd).toBeNull();
    expect(result.netSavingsUsd).toBe(result.grossSavingsUsd);
  });

  it("never credits more hours than the current team works", () => {
    const result = computeRoi({ monthlyVolume: 10_000, agentCount: 1 }, PLANS);

    // 10,000 conv would automate 700 h, but one person only works 160 h.
    expect(result.hoursSaved).toBe(DEFAULT_ASSUMPTIONS.paidHoursPerAgent);
  });

  it("clamps out-of-range and non-finite inputs to the slider ranges", () => {
    const low = computeRoi({ monthlyVolume: -5, agentCount: 0 }, PLANS);
    const atMin = computeRoi(
      { monthlyVolume: VOLUME_RANGE.min, agentCount: AGENT_RANGE.min },
      PLANS,
    );
    const nan = computeRoi({ monthlyVolume: Number.NaN, agentCount: Number.NaN }, PLANS);
    const atInitial = computeRoi(
      { monthlyVolume: VOLUME_RANGE.initial, agentCount: AGENT_RANGE.initial },
      PLANS,
    );

    expect(low).toEqual(atMin);
    expect(nan).toEqual(atInitial);
  });

  it("derives the response-time reduction from the stated assumptions", () => {
    const result = computeRoi({ monthlyVolume: 1_000, agentCount: 2 }, PLANS);

    // 1 - 8 s / 900 s
    expect(result.responseTimeReductionPct).toBeCloseTo(99.11, 1);
  });

  it("can go negative when the platform bill exceeds the savings", () => {
    const result = computeRoi({ monthlyVolume: 500, agentCount: 1 }, [
      { conversations: 500, monthlyCostUsd: 10_000 },
    ]);

    expect(result.netSavingsUsd).toBeLessThan(0);
  });
});
