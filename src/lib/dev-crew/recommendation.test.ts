import { describe, expect, it } from "vitest";
import {
  collapseInsights,
  deriveSeverity,
  parseRecommendation,
  readCrewMetadata,
} from "./recommendation";
import type { CrewInsight } from "@/types";

const TEMPLATE =
  "Analyzed 4 negative telemetry event(s). Most frequent actions: chat.completion (x3), quota.blocked (x1). Most affected resources: audit_logs (x4). Recommendation: inspect the highest-volume failure path and tune the affected tenant guardrails or prompt accordingly.";

describe("parseRecommendation", () => {
  it("splits the pasargad-core template into structured parts", () => {
    expect(parseRecommendation(TEMPLATE)).toMatchObject({
      analyzed: 4,
      actions: [
        { name: "chat.completion", count: 3 },
        { name: "quota.blocked", count: 1 },
      ],
      resources: [{ name: "audit_logs", count: 4 }],
      advice: expect.stringMatching(/^inspect the highest-volume/),
    });
  });

  it("treats n/a lists as empty", () => {
    const text = TEMPLATE.replace(
      "chat.completion (x3), quota.blocked (x1)",
      "n/a",
    );
    expect(parseRecommendation(text).actions).toEqual([]);
  });

  it("falls back to raw text for free-form recommendations", () => {
    const parsed = parseRecommendation("Add refund policy to the knowledge base.");
    expect(parsed).toEqual({
      analyzed: null,
      actions: [],
      resources: [],
      advice: null,
      raw: "Add refund policy to the knowledge base.",
    });
  });
});

describe("deriveSeverity", () => {
  it.each([
    [0, "info"],
    [2, "info"],
    [3, "warning"],
    [9, "warning"],
    [10, "critical"],
    [250, "critical"],
  ] as const)("maps %i negative signals to %s", (count, expected) => {
    expect(deriveSeverity(count)).toBe(expected);
  });
});

describe("readCrewMetadata", () => {
  it("reads valid metadata", () => {
    expect(readCrewMetadata({ recommendation: "x", negative_count: 5 })).toEqual({
      recommendation: "x",
      negativeCount: 5,
    });
  });

  it.each([null, undefined, "nope", 42, { recommendation: 7, negative_count: "many" }])(
    "degrades %j to empty values instead of throwing",
    (input) => {
      expect(readCrewMetadata(input)).toEqual({ recommendation: "", negativeCount: 0 });
    },
  );
});

describe("collapseInsights", () => {
  const row = (id: string, recommendation: string, negativeCount: number): CrewInsight => ({
    id,
    createdAt: `2026-09-19T00:00:0${id}Z`,
    recommendation,
    negativeCount,
  });

  it("merges consecutive duplicates, keeping the newest and the max count", () => {
    const collapsed = collapseInsights([
      row("5", "A", 2),
      row("4", "A", 6),
      row("3", "B", 1),
      row("2", "A", 1),
    ]);
    expect(collapsed.map((c) => [c.id, c.repeats, c.negativeCount])).toEqual([
      ["5", 2, 6],
      ["3", 1, 1],
      ["2", 1, 1],
    ]);
  });

  it("returns an empty list for no input", () => {
    expect(collapseInsights([])).toEqual([]);
  });
});
