// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireMembershipResultMock = vi.fn();
const applyEnabledMock = vi.fn();
const applyUpdateMock = vi.fn();
const logAuditMock = vi.fn();
const planIdMock = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/lib/auth", () => ({ requireMembershipResult: requireMembershipResultMock }));
vi.mock("@/lib/audit", () => ({ logAudit: logAuditMock }));
vi.mock("@/lib/payment/handlers", () => ({
  applyTenantEnabledSkills: applyEnabledMock,
  applyTenantConfigUpdate: applyUpdateMock,
}));

const { updateEnabledSkills, updateSkillConfig } = await import("./actions");

const ORG = "org-1";

function auth(role: "owner" | "admin" | "member") {
  return {
    supabase: {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { plan_id: planIdMock() } }) }) }),
      }),
    },
    user: { id: "user-1" },
    membership: { organizationId: ORG, role },
  };
}

describe("skills actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    planIdMock.mockReturnValue("pro");
    requireMembershipResultMock.mockResolvedValue(auth("owner"));
    applyEnabledMock.mockResolvedValue({});
    applyUpdateMock.mockResolvedValue({});
  });

  describe("updateEnabledSkills", () => {
    it("refuses members", async () => {
      requireMembershipResultMock.mockResolvedValue(auth("member"));
      expect(await updateEnabledSkills(["rag_search"])).toEqual({ error: "forbidden" });
      expect(applyEnabledMock).not.toHaveBeenCalled();
    });

    it("clamps to the plan: a starter org cannot enable calendar_booking", async () => {
      planIdMock.mockReturnValue("starter");
      const result = await updateEnabledSkills(["rag_search", "calendar_booking"]);
      expect(result.error).toBe("planLimit");
      expect(applyEnabledMock).not.toHaveBeenCalled();
    });

    it("resolves the tier from a Stripe price id-less plan (unknown → starter)", async () => {
      planIdMock.mockReturnValue("price_unknown");
      expect((await updateEnabledSkills(["calendar_booking"])).error).toBe("planLimit");
    });

    it("saves, audits and succeeds for an allowed set", async () => {
      const result = await updateEnabledSkills(["rag_search", "calendar_booking"]);
      expect(result).toEqual({ success: true });
      expect(applyEnabledMock).toHaveBeenCalledWith(ORG, ["rag_search", "calendar_booking"]);
      expect(logAuditMock).toHaveBeenCalledWith(
        expect.objectContaining({ action: "skills.updated", organizationId: ORG, actorId: "user-1" }),
      );
    });

    it("allows switching every skill off", async () => {
      expect(await updateEnabledSkills([])).toEqual({ success: true });
    });

    it("hides storage errors behind a generic message", async () => {
      applyEnabledMock.mockResolvedValue({ error: 'relation "tenant_configs" does not exist' });
      expect(await updateEnabledSkills(["rag_search"])).toEqual({ error: "saveFailed" });
      expect(logAuditMock).not.toHaveBeenCalled();
    });

    it("rejects a malformed list", async () => {
      expect((await updateEnabledSkills([""])).error).toBe("invalid");
    });
  });

  describe("updateSkillConfig", () => {
    const valid = { top_k: 8, similarity_threshold: 0.7 };

    it("saves valid rag_search settings through the versioned writer", async () => {
      expect(await updateSkillConfig("rag_search", valid)).toEqual({ success: true });
      expect(applyUpdateMock).toHaveBeenCalledWith(ORG, expect.any(Function));
      const mutate = applyUpdateMock.mock.calls[0][1] as (config: unknown) => Record<string, unknown>;
      expect(mutate({ rag_params: { embedding_model: "m" } }).rag_params).toEqual({
        embedding_model: "m",
        ...valid,
      });
      expect(logAuditMock).toHaveBeenCalledWith(
        expect.objectContaining({ action: "skills.config_updated", metadata: { skill: "rag_search", values: valid } }),
      );
    });

    it.each([
      { top_k: 0, similarity_threshold: 0.7 },
      { top_k: 8, similarity_threshold: 0 },
      { top_k: 8, similarity_threshold: 0.7, _llm_provider: "hijack" },
      "nope",
      null,
    ])("rejects %j", async (values) => {
      expect((await updateSkillConfig("rag_search", values)).error).toBe("invalidConfig");
      expect(applyUpdateMock).not.toHaveBeenCalled();
    });

    it("rejects unknown skills and skills without settings", async () => {
      expect((await updateSkillConfig("teleport", {})).error).toBe("unknownSkill");
      expect((await updateSkillConfig("calendar_booking", {})).error).toBe("notConfigurable");
    });

    it("refuses members", async () => {
      requireMembershipResultMock.mockResolvedValue(auth("member"));
      expect((await updateSkillConfig("rag_search", valid)).error).toBe("forbidden");
    });
  });
});
