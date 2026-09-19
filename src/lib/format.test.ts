import { describe, expect, it } from "vitest";
import { formatBytes, formatMetricNumber, formatMetricPercent } from "./format";

describe("formatMetricNumber", () => {
  it("groups digits per locale", () => {
    expect(formatMetricNumber("en", 1234567)).toBe("1,234,567");
    expect(formatMetricNumber("de", 1234567)).toBe("1.234.567");
  });

  it("keeps Latin digits even in Persian", () => {
    expect(formatMetricNumber("fa", 1234)).toMatch(/^[0-9٬,.\s]+$/u);
    expect(formatMetricNumber("fa", 1234)).not.toMatch(/[۰-۹٠-٩]/u);
  });
});

describe("formatMetricPercent", () => {
  it("formats a 0-100 value as a percentage with at most one decimal", () => {
    expect(formatMetricPercent("en", 94.24)).toBe("94.2%");
    expect(formatMetricPercent("en", 100)).toBe("100%");
    expect(formatMetricPercent("en", 0)).toBe("0%");
  });
});

describe("formatBytes", () => {
  it("picks the unit by magnitude", () => {
    expect(formatBytes("en", 512)).toMatch(/^512\s?B$/);
    expect(formatBytes("en", 1536)).toMatch(/^1\.5\s?kB$/i);
    expect(formatBytes("en", 5 * 1024 * 1024)).toMatch(/^5\s?MB$/);
  });
});
