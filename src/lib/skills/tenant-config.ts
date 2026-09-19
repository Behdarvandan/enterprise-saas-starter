import type { Json } from "@/types";
import {
  RAG_SEARCH_FIELDS,
  ragSearchSchema,
  type RagSearchValues,
} from "@/lib/skills/skill-config";
import type { SkillId } from "@/lib/skills-catalog";

/**
 * Typed access to `tenant_configs.config` (jsonb). Only the keys the
 * dashboard owns are modelled; everything else — `system_prompt`,
 * `llm_provider`, backend-only `rag_params` keys — is preserved verbatim by
 * the `with*` writers.
 */
type ConfigObject = { [key: string]: Json | undefined };

function asObject(value: unknown): ConfigObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ConfigObject) : {};
}

/** Reads `crew_config.enabled_skills`, or null when absent/malformed. */
export function readEnabledSkills(config: unknown): string[] | null {
  const skills = asObject(asObject(config).crew_config).enabled_skills;
  return Array.isArray(skills) && skills.every((skill) => typeof skill === "string")
    ? (skills as string[])
    : null;
}

/** Current `rag_params` values, falling back per-key to the backend defaults. */
export function readRagSearchValues(config: unknown): RagSearchValues {
  const stored = asObject(asObject(config).rag_params);
  const values = { top_k: 0, similarity_threshold: 0 } satisfies RagSearchValues;

  for (const field of RAG_SEARCH_FIELDS) {
    const candidate = stored[field.key];
    const valid = ragSearchSchema.shape[field.key].safeParse(candidate);
    values[field.key] = valid.success ? valid.data : field.defaultValue;
  }
  return values;
}

export function withEnabledSkills(config: unknown, skills: readonly string[]): ConfigObject {
  const base = asObject(config);
  return { ...base, crew_config: { ...asObject(base.crew_config), enabled_skills: [...skills] } };
}

/** Merges the skill's settings into the config without touching sibling keys. */
export function withSkillConfig(
  config: unknown,
  skillId: SkillId,
  values: Record<string, number>,
): ConfigObject {
  const base = asObject(config);
  switch (skillId) {
    case "rag_search":
      return { ...base, rag_params: { ...asObject(base.rag_params), ...values } };
    default:
      // Skills without settings have nothing to persist.
      return base;
  }
}
