import { describe, expect, it } from "vitest";
import { ragSearchSchema, buildSkillConfigSchema, RAG_SEARCH_FIELDS } from "./skill-config";
import {
  readEnabledSkills,
  readRagSearchValues,
  withEnabledSkills,
  withSkillConfig,
} from "./tenant-config";

describe("readEnabledSkills", () => {
  it("reads a valid list", () => {
    expect(readEnabledSkills({ crew_config: { enabled_skills: ["rag_search"] } })).toEqual(["rag_search"]);
  });

  it.each([null, undefined, {}, { crew_config: null }, { crew_config: { enabled_skills: "rag_search" } }, { crew_config: { enabled_skills: [1] } }])(
    "returns null for %j",
    (input) => {
      expect(readEnabledSkills(input)).toBeNull();
    },
  );
});

describe("readRagSearchValues", () => {
  it("falls back to the backend defaults per key", () => {
    expect(readRagSearchValues({})).toEqual({ top_k: 5, similarity_threshold: 0.6 });
    expect(readRagSearchValues({ rag_params: { top_k: 8 } })).toEqual({ top_k: 8, similarity_threshold: 0.6 });
  });

  it("ignores out-of-range or wrongly typed stored values", () => {
    expect(readRagSearchValues({ rag_params: { top_k: 999, similarity_threshold: "high" } })).toEqual({
      top_k: 5,
      similarity_threshold: 0.6,
    });
  });
});

describe("config writers", () => {
  const config = {
    system_prompt: "Be helpful",
    crew_config: { enabled_skills: ["rag_search"], extra: true },
    rag_params: { top_k: 5, embedding_model: "gemini-embedding-001", _llm_provider: "secret" },
  };

  it("withEnabledSkills preserves every sibling key", () => {
    const next = withEnabledSkills(config, ["rag_search", "calendar_booking"]);
    expect(next.system_prompt).toBe("Be helpful");
    expect(next.rag_params).toEqual(config.rag_params);
    expect(next.crew_config).toEqual({ enabled_skills: ["rag_search", "calendar_booking"], extra: true });
  });

  it("withSkillConfig only merges the edited rag_params keys and keeps backend-owned ones", () => {
    const next = withSkillConfig(config, "rag_search", { top_k: 9, similarity_threshold: 0.7 });
    expect(next.rag_params).toEqual({
      top_k: 9,
      similarity_threshold: 0.7,
      embedding_model: "gemini-embedding-001",
      _llm_provider: "secret",
    });
    expect(next.crew_config).toEqual(config.crew_config);
  });

  it("does not mutate its input", () => {
    const snapshot = JSON.stringify(config);
    withEnabledSkills(config, []);
    withSkillConfig(config, "rag_search", { top_k: 1, similarity_threshold: 0.2 });
    expect(JSON.stringify(config)).toBe(snapshot);
  });

  it("tolerates a missing or non-object config", () => {
    expect(withEnabledSkills(null, ["rag_search"])).toEqual({ crew_config: { enabled_skills: ["rag_search"] } });
    expect(withSkillConfig("nope", "calendar_booking", {})).toEqual({});
  });
});

describe("ragSearchSchema", () => {
  it("accepts in-range values", () => {
    expect(ragSearchSchema.safeParse({ top_k: 5, similarity_threshold: 0.6 }).success).toBe(true);
  });

  it.each([
    { top_k: 0, similarity_threshold: 0.6 },
    { top_k: 21, similarity_threshold: 0.6 },
    { top_k: 2.5, similarity_threshold: 0.6 },
    { top_k: 5, similarity_threshold: 0 },
    { top_k: 5, similarity_threshold: 1 },
    { top_k: 5, similarity_threshold: 0.6, _llm_provider: "x" },
  ])("rejects %j (range, integrality and unknown keys)", (input) => {
    expect(ragSearchSchema.safeParse(input).success).toBe(false);
  });

  it("builds a schema from descriptors", () => {
    const schema = buildSkillConfigSchema(RAG_SEARCH_FIELDS);
    expect(schema.safeParse({ top_k: 3, similarity_threshold: 0.5 }).success).toBe(true);
  });
});
