// @vitest-environment node
import { describe, expect, it } from "vitest";

const { findDisallowedSkills, getAllowedAgencySkills, readEnabledSkills } = await import("./skills");

function clientWithPlan(planId: string | null, capture?: (id: string) => void) {
  return {
    from: () => ({
      select: () => ({
        eq: (_column: string, id: string) => {
          capture?.(id);
          return { maybeSingle: async () => ({ data: planId === undefined ? null : { plan_id: planId } }) };
        },
      }),
    }),
  } as never;
}

describe("getAllowedAgencySkills", () => {
  it("uses the agency's own (master organization) plan", async () => {
    let queried = "";
    const skills = await getAllowedAgencySkills(clientWithPlan("pro", (id) => (queried = id)), {
      master_tenant_id: "master-1",
    });
    expect(skills).toEqual(["rag_search", "calendar_booking"]);
    expect(queried).toBe("master-1");
  });

  it("falls back to the default set for an unknown or missing plan", async () => {
    expect(await getAllowedAgencySkills(clientWithPlan("legacy"), { master_tenant_id: "m" })).toEqual(["rag_search"]);
    expect(await getAllowedAgencySkills(clientWithPlan(null), { master_tenant_id: "m" })).toEqual(["rag_search"]);
  });
});

describe("findDisallowedSkills", () => {
  it("lists requested skills outside the allowed set", () => {
    expect(findDisallowedSkills(["rag_search", "calendar_booking"], ["rag_search"])).toEqual(["calendar_booking"]);
    expect(findDisallowedSkills(["rag_search"], ["rag_search", "calendar_booking"])).toEqual([]);
    expect(findDisallowedSkills([], ["rag_search"])).toEqual([]);
  });
});

describe("readEnabledSkills", () => {
  it("reads crew_config.enabled_skills", () => {
    expect(readEnabledSkills({ crew_config: { enabled_skills: ["rag_search"] } })).toEqual(["rag_search"]);
    expect(readEnabledSkills({ crew_config: { enabled_skills: [] } })).toEqual([]);
  });

  it.each([null, undefined, "x", {}, { crew_config: null }, { crew_config: {} }, { crew_config: { enabled_skills: "rag" } }, { crew_config: { enabled_skills: [1] } }])(
    "returns null for %j",
    (config) => {
      expect(readEnabledSkills(config)).toBeNull();
    },
  );
});
