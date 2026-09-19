// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatDateUtc, formatPercent, formatTokens } from "./format";

describe("agency format helpers", () => {
  it("formats tokens per locale with Latin digits", () => {
    expect(formatTokens("en", 1234567)).toBe("1,234,567");
    expect(formatTokens("de", 1234567)).toBe("1.234.567");
    expect(formatTokens("fa", 1234)).not.toMatch(/[۰-۹]/u);
  });

  it("rounds percentages to whole numbers", () => {
    expect(formatPercent("en", 42.4)).toBe("42%");
    expect(formatPercent("en", 99.6)).toBe("100%");
  });

  it("formats dates in UTC and tolerates a missing timestamp", () => {
    expect(formatDateUtc("en", "2026-09-18T23:59:00Z")).toBe("Sep 18, 2026");
    expect(formatDateUtc("en", null)).toBe("—");
  });
});
