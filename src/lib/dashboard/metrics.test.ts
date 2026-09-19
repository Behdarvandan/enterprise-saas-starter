import { describe, expect, it } from "vitest";
import {
  deriveAgentState,
  QUOTA_LOW_PERCENT,
  quotaUsage,
  ragSuccessRate,
} from "./metrics";

describe("ragSuccessRate", () => {
  it("is null without completions (no data is not 0%)", () => {
    expect(ragSuccessRate({ completions: 0, lowConfidence: 0, quotaExhausted: 0 })).toBeNull();
  });

  it("counts fallbacks and quota-blocked replies as unsuccessful", () => {
    expect(ragSuccessRate({ completions: 100, lowConfidence: 10, quotaExhausted: 5 })).toBe(85);
  });

  it("never goes negative when counters overlap", () => {
    expect(ragSuccessRate({ completions: 10, lowConfidence: 10, quotaExhausted: 10 })).toBe(0);
  });
});

describe("quotaUsage", () => {
  it("computes percent, remaining and the rolling reset date", () => {
    const usage = quotaUsage({
      tokensUsed: 25_000,
      tokensLimit: 100_000,
      periodStart: "2026-09-01T00:00:00Z",
    });
    expect(usage.percent).toBe(25);
    expect(usage.remaining).toBe(75_000);
    expect(usage.resetsAt?.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(usage.tone).toBe("primary");
  });

  it("escalates tone at the low and exhausted thresholds", () => {
    const at = (used: number) => quotaUsage({ tokensUsed: used, tokensLimit: 100, periodStart: null });
    expect(at(QUOTA_LOW_PERCENT - 1).tone).toBe("primary");
    expect(at(QUOTA_LOW_PERCENT).tone).toBe("warn");
    expect(at(100).tone).toBe("error");
    expect(at(250).percent).toBe(100);
  });

  it("survives a zero limit and a garbage period start", () => {
    const usage = quotaUsage({ tokensUsed: 5, tokensLimit: 0, periodStart: "not-a-date" });
    expect(usage.percent).toBe(0);
    expect(usage.resetsAt).toBeNull();
  });
});

describe("deriveAgentState", () => {
  const quota = (percent: number) => ({ percent });

  it.each([
    ["active", 10, "live"],
    ["trialing", 79, "live"],
    ["active", 80, "quota_low"],
    ["active", 100, "quota_exhausted"],
    ["inactive", 10, "inactive"],
    ["canceled", 0, "inactive"],
  ] as const)("%s at %i%% is %s", (subscriptionStatus, percent, expected) => {
    expect(deriveAgentState({ subscriptionStatus, quota: quota(percent) })).toBe(expected);
  });

  it("serves agency child tenants regardless of their own subscription", () => {
    expect(
      deriveAgentState({ subscriptionStatus: "inactive", quota: quota(10), servedByAgency: true }),
    ).toBe("live");
  });
});
