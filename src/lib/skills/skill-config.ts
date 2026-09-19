import { z } from "zod";
import type { SkillId } from "@/lib/skills-catalog";

/**
 * Tunable settings per skill. The dashboard's configuration dialog renders
 * straight from these descriptors and the Server Action validates against the
 * schema built from them, so the form and the write path cannot drift apart.
 */
export interface NumberField {
  key: string;
  kind: "int" | "float";
  min: number;
  max: number;
  step: number;
  /** What pasargad-core uses when the key is absent (see nodes/ops.py). */
  defaultValue: number;
}

export interface SkillConfigDefinition {
  fields: readonly NumberField[];
}

/** Keys of `rag_params` a tenant may edit. Everything else there belongs to the backend. */
export const RAG_SEARCH_FIELDS = [
  { key: "top_k", kind: "int", min: 1, max: 20, step: 1, defaultValue: 5 },
  // 0 is excluded: the backend treats a falsy threshold as "use the default".
  { key: "similarity_threshold", kind: "float", min: 0.1, max: 0.95, step: 0.05, defaultValue: 0.6 },
] as const satisfies readonly NumberField[];

export type RagSearchFieldKey = (typeof RAG_SEARCH_FIELDS)[number]["key"];
export type RagSearchValues = Record<RagSearchFieldKey, number>;

export const SKILL_CONFIG: Partial<Record<SkillId, SkillConfigDefinition>> = {
  rag_search: { fields: RAG_SEARCH_FIELDS },
};

export function getSkillConfig(skillId: SkillId): SkillConfigDefinition | null {
  return SKILL_CONFIG[skillId] ?? null;
}

function fieldSchema(field: NumberField) {
  const base = field.kind === "int" ? z.number().int() : z.number();
  return base.min(field.min).max(field.max);
}

/** Strict object schema for one skill's settings: unknown keys are rejected. */
export function buildSkillConfigSchema(fields: readonly NumberField[]) {
  return z
    .object(Object.fromEntries(fields.map((field) => [field.key, fieldSchema(field)])))
    .strict();
}

export const ragSearchSchema = buildSkillConfigSchema(RAG_SEARCH_FIELDS);

export function defaultsFor(fields: readonly NumberField[]): Record<string, number> {
  return Object.fromEntries(fields.map((field) => [field.key, field.defaultValue]));
}
