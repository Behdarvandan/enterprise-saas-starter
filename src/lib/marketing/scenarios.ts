/**
 * Scripted scenarios for the landing-page agent simulator. Everything here is
 * sample data — the playground labels itself a simulation. Copy lives in the
 * `marketing.landing.playground.scenarios.<id>` message keys; this file holds
 * only the structure and the sample numbers.
 */

export const SCENARIO_IDS = ["pricing", "booking", "escalation"] as const;
export type ScenarioId = (typeof SCENARIO_IDS)[number];

/** Retrieval similarity below this is treated as low confidence (backend default: 0.6). */
export const CONFIDENCE_THRESHOLD = 0.6;

export type ThoughtStep =
  | { kind: "intent" }
  | { kind: "rag_search" }
  | { kind: "retrieval"; chunks: number; similarity: number }
  | { kind: "confidence"; score: number; threshold: number }
  | { kind: "tool_call" }
  | { kind: "handoff" };

export type ThoughtStepKind = ThoughtStep["kind"];

export interface Scenario {
  id: ScenarioId;
  steps: readonly ThoughtStep[];
}

export const SCENARIOS: readonly Scenario[] = [
  {
    id: "pricing",
    steps: [
      { kind: "intent" },
      { kind: "rag_search" },
      { kind: "retrieval", chunks: 3, similarity: 0.91 },
      { kind: "confidence", score: 0.91, threshold: CONFIDENCE_THRESHOLD },
    ],
  },
  {
    id: "booking",
    steps: [
      { kind: "intent" },
      { kind: "rag_search" },
      { kind: "retrieval", chunks: 2, similarity: 0.84 },
      { kind: "confidence", score: 0.84, threshold: CONFIDENCE_THRESHOLD },
      { kind: "tool_call" },
    ],
  },
  {
    id: "escalation",
    steps: [
      { kind: "intent" },
      { kind: "rag_search" },
      { kind: "retrieval", chunks: 1, similarity: 0.41 },
      { kind: "confidence", score: 0.41, threshold: CONFIDENCE_THRESHOLD },
      { kind: "handoff" },
    ],
  },
];

/** Whether a confidence step clears its threshold. */
export function isConfident(step: Extract<ThoughtStep, { kind: "confidence" }>): boolean {
  return step.score >= step.threshold;
}
