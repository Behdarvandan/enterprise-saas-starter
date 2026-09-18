// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatDateUtc, formatPercent, formatRelativeTime, formatTokens } from "./format";

describe("format helpers", () => {
  it("formats tokens with a fixed locale", () => {
    expect(formatTokens(1234567)).toBe("1,234,567");
  });

  it("rounds percentages", () => {
    expect(formatPercent(79.6)).toBe("80%");
  });

  it("formats relative time", () => {
    const now = new Date("2026-09-18T12:00:00Z");
    expect(formatRelativeTime(null, now)).toBe("—");
    expect(formatRelativeTime("2026-09-18T11:59:40Z", now)).toBe("Just now");
    expect(formatRelativeTime("2026-09-18T11:30:00Z", now)).toBe("30m ago");
    expect(formatRelativeTime("2026-09-18T09:00:00Z", now)).toBe("3h ago");
    expect(formatRelativeTime("2026-09-16T12:00:00Z", now)).toBe("2d ago");
  });

  it("formats dates in UTC", () => {
    expect(formatDateUtc("2026-09-18T23:59:00Z")).toBe("Sep 18, 2026");
    expect(formatDateUtc(null)).toBe("—");
  });
});
