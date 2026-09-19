import { describe, expect, it } from "vitest";
import { SCENARIO_IDS, SCENARIOS, isConfident } from "./scenarios";

describe("landing scenarios", () => {
  it("defines exactly one scenario per id, in order", () => {
    expect(SCENARIOS.map((scenario) => scenario.id)).toEqual([...SCENARIO_IDS]);
  });

  it.each(SCENARIOS)("$id starts with intent and retrieves before scoring", (scenario) => {
    const kinds = scenario.steps.map((step) => step.kind);

    expect(kinds[0]).toBe("intent");
    expect(kinds.indexOf("rag_search")).toBeLessThan(kinds.indexOf("retrieval"));
    expect(kinds.indexOf("retrieval")).toBeLessThan(kinds.indexOf("confidence"));
  });

  it("keeps the confidence score consistent with the retrieval similarity", () => {
    for (const scenario of SCENARIOS) {
      const retrieval = scenario.steps.find((step) => step.kind === "retrieval");
      const confidence = scenario.steps.find((step) => step.kind === "confidence");
      if (retrieval?.kind !== "retrieval" || confidence?.kind !== "confidence") {
        throw new Error(`${scenario.id} is missing a retrieval or confidence step`);
      }

      expect(confidence.score).toBe(retrieval.similarity);
    }
  });

  it("only escalates to Dev Crew when confidence is low, and only books when it is high", () => {
    for (const scenario of SCENARIOS) {
      const confidence = scenario.steps.find((step) => step.kind === "confidence");
      if (confidence?.kind !== "confidence") throw new Error("missing confidence step");
      const kinds = scenario.steps.map((step) => step.kind);

      expect(kinds.includes("handoff")).toBe(!isConfident(confidence));
      if (kinds.includes("tool_call")) expect(isConfident(confidence)).toBe(true);
    }
  });
});
