// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  consumptionPercent,
  parseAnalyticsWindow,
  summarizePool,
  summarizeUsage,
  toTokenUsagePoints,
  type AgencyUsageRow,
} from "./usage";

function row(overrides: Partial<AgencyUsageRow> = {}): AgencyUsageRow {
  return {
    tenant_id: "t1",
    tenant_name: "Acme",
    tenant_slug: "acme",
    quota_granted: 1000,
    quota_allocation: 1000,
    rag_requests: 0,
    completions: 0,
    low_confidence: 0,
    quota_exhausted: 0,
    last_activity_at: null,
    ...overrides,
  };
}

describe("consumptionPercent", () => {
  it("is consumed share of the allocation", () => {
    expect(consumptionPercent({ quota_granted: 1000, quota_allocation: 250 })).toBe(75);
  });

  it("is 0 with nothing allocated (no budget to be near the limit of)", () => {
    expect(consumptionPercent({ quota_granted: 0, quota_allocation: 0 })).toBe(0);
  });

  it("never goes below 0 or above 100 on inconsistent data", () => {
    expect(consumptionPercent({ quota_granted: 100, quota_allocation: 500 })).toBe(0);
    expect(consumptionPercent({ quota_granted: 100, quota_allocation: -50 })).toBe(100);
  });
});

describe("summarizeUsage", () => {
  it("returns zeros for no tenants", () => {
    expect(summarizeUsage([])).toEqual({
      tenantCount: 0,
      totalRequests: 0,
      totalCompletions: 0,
      tokensGranted: 0,
      tokensConsumed: 0,
      consumptionPercent: 0,
      lowConfidenceCount: 0,
      lowConfidenceRate: 0,
      quotaExhaustedCount: 0,
      tenantsNearLimit: 0,
      tenantsOutOfTokens: 0,
    });
  });

  it("aggregates across tenants", () => {
    const summary = summarizeUsage([
      row({ tenant_id: "a", quota_granted: 1000, quota_allocation: 500, rag_requests: 10, completions: 8, low_confidence: 2 }),
      row({ tenant_id: "b", quota_granted: 1000, quota_allocation: 1000, rag_requests: 5, completions: 2, low_confidence: 0, quota_exhausted: 1 }),
    ]);
    expect(summary.tenantCount).toBe(2);
    expect(summary.totalRequests).toBe(15);
    expect(summary.totalCompletions).toBe(10);
    expect(summary.tokensGranted).toBe(2000);
    expect(summary.tokensConsumed).toBe(500);
    expect(summary.consumptionPercent).toBe(25);
    expect(summary.lowConfidenceCount).toBe(2);
    expect(summary.lowConfidenceRate).toBe(20);
    expect(summary.quotaExhaustedCount).toBe(1);
  });

  it("flags tenants near their limit or out of tokens, ignoring unallocated ones", () => {
    const summary = summarizeUsage([
      row({ tenant_id: "ok", quota_granted: 1000, quota_allocation: 900 }),
      row({ tenant_id: "near", quota_granted: 1000, quota_allocation: 200 }), // 80%
      row({ tenant_id: "out", quota_granted: 1000, quota_allocation: 0 }),
      row({ tenant_id: "none", quota_granted: 0, quota_allocation: 0 }),
    ]);
    expect(summary.tenantsNearLimit).toBe(1);
    expect(summary.tenantsOutOfTokens).toBe(1);
  });
});

describe("toTokenUsagePoints", () => {
  it("skips tenants without an allocation and sorts most-consumed first", () => {
    const points = toTokenUsagePoints([
      row({ tenant_id: "a", tenant_name: "Low", quota_granted: 1000, quota_allocation: 900 }),
      row({ tenant_id: "b", tenant_name: "Unallocated", quota_granted: 0, quota_allocation: 0 }),
      row({ tenant_id: "c", tenant_name: "High", quota_granted: 1000, quota_allocation: 100 }),
    ]);
    expect(points.map((point) => point.organization)).toEqual(["High", "Low"]);
    expect(points[0]).toEqual({
      organization: "High",
      percentUsed: 90,
      tokensUsed: 900,
      tokensLimit: 1000,
    });
  });

  it("caps the number of bars", () => {
    const many = Array.from({ length: 30 }, (_, index) => row({ tenant_id: `t${index}`, tenant_name: `T${index}` }));
    expect(toTokenUsagePoints(many)).toHaveLength(12);
  });
});

describe("summarizePool", () => {
  it("splits the pool into allocated and available", () => {
    expect(summarizePool(1000, [{ quota_granted: 300 }, { quota_granted: 200 }])).toEqual({
      pool: 1000,
      allocated: 500,
      unallocated: 500,
      percentAllocated: 50,
    });
  });

  it("handles an empty pool without dividing by zero", () => {
    expect(summarizePool(0, [])).toEqual({ pool: 0, allocated: 0, unallocated: 0, percentAllocated: 0 });
  });

  it("never reports negative availability if data is over-allocated", () => {
    expect(summarizePool(100, [{ quota_granted: 150 }]).unallocated).toBe(0);
  });
});

describe("parseAnalyticsWindow", () => {
  it("accepts only the whitelisted windows", () => {
    expect(parseAnalyticsWindow("7")).toBe(7);
    expect(parseAnalyticsWindow("90")).toBe(90);
    expect(parseAnalyticsWindow(["7", "30"])).toBe(7);
  });

  it.each([undefined, "", "abc", "0", "365", "-7", "7; drop table"])("falls back to 30 for %j", (raw) => {
    expect(parseAnalyticsWindow(raw)).toBe(30);
  });
});
