// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const AGENCY_ID = "99999999-0000-0000-0000-000000000009";
const TENANT_ID = "22222222-0000-0000-0000-000000000002";
const NEW_TENANT_ID = "33333333-0000-0000-0000-000000000003";

const requireAgencyAdminResultMock = vi.fn();
const revalidatePathMock = vi.fn();
const logAgencyAuditMock = vi.fn();
const applyTenantEnabledSkillsMock = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next-intl/server", async () => (await import("@/test/intl")).nextIntlServerMock());
vi.mock("@/lib/agency/admin", () => ({ requireAgencyAdminResult: requireAgencyAdminResultMock }));
vi.mock("@/lib/agency/audit", () => ({ logAgencyAudit: logAgencyAuditMock }));
vi.mock("@/lib/payment/handlers", () => ({
  applyTenantEnabledSkills: applyTenantEnabledSkillsMock,
}));

const { allocateQuota, createTenant, linkTenant, unlinkTenant, updateTenantSkills } = await import("./actions");

interface QueryResult {
  data: unknown;
  error?: unknown;
}
interface Chain {
  select: () => Chain;
  eq: () => Chain;
  maybeSingle: () => Promise<QueryResult>;
}

function chain(result: QueryResult): Chain {
  const self: Chain = {
    select: () => self,
    eq: () => self,
    maybeSingle: async () => ({ error: null, ...result }),
  };
  return self;
}

/** A signed-in agency admin whose queries/RPCs are driven by the given maps. */
function signInAsAgencyAdmin(options: {
  tables?: Record<string, QueryResult>;
  rpc?: QueryResult;
}) {
  const rpc = vi.fn().mockResolvedValue({ data: null, error: null, ...options.rpc });
  const from = vi.fn((table: string) => chain(options.tables?.[table] ?? { data: null }));
  requireAgencyAdminResultMock.mockResolvedValue({
    supabase: { from, rpc },
    user: { id: "user-1" },
    membership: { organizationId: "master-1", role: "owner" },
    agency: { id: AGENCY_ID, master_tenant_id: "master-1", name: "Acme" },
  });
  return { rpc, from };
}

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("agency tenant actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    applyTenantEnabledSkillsMock.mockResolvedValue({});
  });

  describe("authorization (every action)", () => {
    const attempts: [string, () => Promise<unknown>][] = [
      ["linkTenant", () => linkTenant(form({ organizationId: TENANT_ID }))],
      ["createTenant", () => createTenant(form({ name: "Acme", slug: "acme-shop" }))],
      ["unlinkTenant", () => unlinkTenant(TENANT_ID)],
      ["allocateQuota", () => allocateQuota(TENANT_ID, "100")],
      ["updateTenantSkills", () => updateTenantSkills(TENANT_ID, ["rag_search"])],
    ];

    it.each(attempts)("%s returns the guard's error and touches nothing for a non-agency-admin", async (_name, run) => {
      requireAgencyAdminResultMock.mockResolvedValue({ error: "You do not administer an agency." });

      expect(await run()).toEqual({ error: "You do not administer an agency." });
      expect(applyTenantEnabledSkillsMock).not.toHaveBeenCalled();
      expect(logAgencyAuditMock).not.toHaveBeenCalled();
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });
  });

  describe("linkTenant", () => {
    it("rejects a malformed organization id before touching the database", async () => {
      const { rpc, from } = signInAsAgencyAdmin({});

      const result = await linkTenant(form({ organizationId: "not-a-uuid" }));

      expect(result.error).toMatch(/valid tenant id/i);
      expect(from).not.toHaveBeenCalled();
      expect(rpc).not.toHaveBeenCalled();
    });

    it("gives the same answer for an unknown id and someone else's organization (RLS hides it)", async () => {
      const { rpc } = signInAsAgencyAdmin({ tables: { organizations: { data: null } } });

      const result = await linkTenant(form({ organizationId: TENANT_ID }));

      expect(result.error).toMatch(/among the ones you own/i);
      expect(rpc).not.toHaveBeenCalled();
    });

    it("links using the agency resolved server-side, then audits and revalidates", async () => {
      const { rpc } = signInAsAgencyAdmin({ tables: { organizations: { data: { id: TENANT_ID } } } });

      const result = await linkTenant(form({ organizationId: TENANT_ID, agency_id: "attacker-agency" }));

      expect(result).toEqual({ success: true });
      expect(rpc).toHaveBeenCalledWith("link_agency_tenant", {
        p_agency_id: AGENCY_ID,
        p_tenant_id: TENANT_ID,
      });
      expect(logAgencyAuditMock).toHaveBeenCalledWith(
        expect.objectContaining({ action: "agency.tenant_linked", targetId: TENANT_ID, actorId: "user-1" }),
      );
      expect(revalidatePathMock).toHaveBeenCalledWith("/agency/tenants");
    });

    it.each([
      ["not_tenant_owner", /you own/i],
      ["tenant_already_linked", /already linked/i],
      ["tenant_is_master", /own organization/i],
    ])("maps the %s RPC error to friendly copy", async (key, pattern) => {
      signInAsAgencyAdmin({
        tables: { organizations: { data: { id: TENANT_ID } } },
        rpc: { data: null, error: { message: key } },
      });

      const result = await linkTenant(form({ organizationId: TENANT_ID }));

      expect(result.error).toMatch(pattern);
      expect(logAgencyAuditMock).not.toHaveBeenCalled();
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });
  });

  describe("createTenant", () => {
    it("creates atomically via the RPC and seeds the tenant's config", async () => {
      const { rpc } = signInAsAgencyAdmin({ rpc: { data: NEW_TENANT_ID } });

      const result = await createTenant(form({ name: "  New Client ", slug: "New-Client" }));

      expect(result).toEqual({ success: true });
      expect(rpc).toHaveBeenCalledWith("create_agency_tenant", {
        p_agency_id: AGENCY_ID,
        p_name: "New Client",
        p_slug: "new-client",
      });
      expect(applyTenantEnabledSkillsMock).toHaveBeenCalledWith(NEW_TENANT_ID, ["rag_search"]);
      expect(logAgencyAuditMock).toHaveBeenCalledWith(
        expect.objectContaining({ action: "agency.tenant_created", targetId: NEW_TENANT_ID }),
      );
    });

    it("still succeeds when seeding the config fails (the tenant exists)", async () => {
      signInAsAgencyAdmin({ rpc: { data: NEW_TENANT_ID } });
      applyTenantEnabledSkillsMock.mockResolvedValue({ error: "db down" });

      expect(await createTenant(form({ name: "New", slug: "new-client" }))).toEqual({ success: true });
    });

    it("validates name and slug", async () => {
      const { rpc } = signInAsAgencyAdmin({});
      expect((await createTenant(form({ name: "", slug: "new-client" }))).error).toMatch(/name/i);
      expect((await createTenant(form({ name: "New", slug: "x" }))).error).toMatch(/slug/i);
      expect(rpc).not.toHaveBeenCalled();
    });

    it("reports a taken slug and does not seed a config", async () => {
      signInAsAgencyAdmin({ rpc: { data: null, error: { message: "slug_taken" } } });

      const result = await createTenant(form({ name: "New", slug: "new-client" }));

      expect(result.error).toMatch(/already taken/i);
      expect(applyTenantEnabledSkillsMock).not.toHaveBeenCalled();
    });
  });

  describe("unlinkTenant", () => {
    it("rejects a malformed tenant id", async () => {
      const { rpc } = signInAsAgencyAdmin({});
      expect((await unlinkTenant("not-a-uuid")).error).toBeTruthy();
      expect(rpc).not.toHaveBeenCalled();
    });

    it("unlinks via the RPC scoped to the caller's agency", async () => {
      const { rpc } = signInAsAgencyAdmin({});

      expect(await unlinkTenant(TENANT_ID)).toEqual({ success: true });
      expect(rpc).toHaveBeenCalledWith("unlink_agency_tenant", { p_agency_id: AGENCY_ID, p_tenant_id: TENANT_ID });
      expect(logAgencyAuditMock).toHaveBeenCalledWith(expect.objectContaining({ action: "agency.tenant_unlinked" }));
    });

    it("maps a tenant that isn't linked", async () => {
      signInAsAgencyAdmin({ rpc: { data: null, error: { message: "tenant_not_in_agency" } } });
      expect((await unlinkTenant(TENANT_ID)).error).toMatch(/isn't linked/i);
    });
  });

  describe("allocateQuota", () => {
    it.each(["", "abc", "-5", "1.5", "99999999999"])("rejects %j without calling the RPC", async (value) => {
      const { rpc } = signInAsAgencyAdmin({});
      expect((await allocateQuota(TENANT_ID, value)).error).toBeTruthy();
      expect(rpc).not.toHaveBeenCalled();
    });

    it("passes a validated number and the caller's agency to the RPC", async () => {
      const { rpc } = signInAsAgencyAdmin({});

      expect(await allocateQuota(TENANT_ID, " 2500 ")).toEqual({ success: true });
      expect(rpc).toHaveBeenCalledWith("allocate_agency_tenant_quota", {
        p_agency_id: AGENCY_ID,
        p_tenant_id: TENANT_ID,
        p_total: 2500,
      });
      expect(logAgencyAuditMock).toHaveBeenCalledWith(
        expect.objectContaining({ action: "agency.quota_allocated", metadata: { total: 2500 } }),
      );
    });

    it.each([
      ["quota_pool_exceeded", /exceed your token pool/i],
      ["quota_below_consumed", /already used/i],
    ])("maps %s", async (key, pattern) => {
      signInAsAgencyAdmin({ rpc: { data: null, error: { message: key } } });
      expect((await allocateQuota(TENANT_ID, "10")).error).toMatch(pattern);
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });

    it("hides unexpected database errors behind a generic message", async () => {
      signInAsAgencyAdmin({ rpc: { data: null, error: { message: 'relation "x" does not exist' } } });
      const result = await allocateQuota(TENANT_ID, "10");
      expect(result.error).toBe("Something went wrong. Please try again.");
    });
  });

  describe("updateTenantSkills", () => {
    it("refuses a tenant that isn't linked to the caller's agency", async () => {
      signInAsAgencyAdmin({ tables: { agency_tenants: { data: null } } });

      const result = await updateTenantSkills(TENANT_ID, ["rag_search"]);

      expect(result.error).toMatch(/isn't linked/i);
      expect(applyTenantEnabledSkillsMock).not.toHaveBeenCalled();
    });

    it("clamps to the agency's own plan: a starter agency can't hand out calendar_booking", async () => {
      signInAsAgencyAdmin({
        tables: { agency_tenants: { data: { tenant_id: TENANT_ID } }, organizations: { data: { plan_id: "starter" } } },
      });

      // "starter" isn't in the mocked plan map, so the default (rag_search only) applies.
      const result = await updateTenantSkills(TENANT_ID, ["rag_search", "calendar_booking"]);

      expect(result.error).toMatch(/calendar_booking/);
      expect(applyTenantEnabledSkillsMock).not.toHaveBeenCalled();
    });

    it("applies an allowed selection for a linked tenant", async () => {
      signInAsAgencyAdmin({
        tables: { agency_tenants: { data: { tenant_id: TENANT_ID } }, organizations: { data: { plan_id: "pro" } } },
      });

      const result = await updateTenantSkills(TENANT_ID, ["rag_search", "calendar_booking"]);

      expect(result).toEqual({ success: true });
      expect(applyTenantEnabledSkillsMock).toHaveBeenCalledWith(TENANT_ID, ["rag_search", "calendar_booking"]);
      expect(logAgencyAuditMock).toHaveBeenCalledWith(expect.objectContaining({ action: "agency.tenant_skills_updated" }));
    });

    it("allows switching every skill off", async () => {
      signInAsAgencyAdmin({
        tables: { agency_tenants: { data: { tenant_id: TENANT_ID } }, organizations: { data: { plan_id: "pro" } } },
      });
      expect(await updateTenantSkills(TENANT_ID, [])).toEqual({ success: true });
      expect(applyTenantEnabledSkillsMock).toHaveBeenCalledWith(TENANT_ID, []);
    });

    it("surfaces a config write failure generically and skips audit/revalidate", async () => {
      signInAsAgencyAdmin({
        tables: { agency_tenants: { data: { tenant_id: TENANT_ID } }, organizations: { data: { plan_id: "pro" } } },
      });
      applyTenantEnabledSkillsMock.mockResolvedValue({ error: "insert failed: secret detail" });

      const result = await updateTenantSkills(TENANT_ID, ["rag_search"]);

      expect(result.error).toBe("Something went wrong. Please try again.");
      expect(logAgencyAuditMock).not.toHaveBeenCalled();
    });

    it("rejects a malformed skill list", async () => {
      signInAsAgencyAdmin({});
      expect((await updateTenantSkills(TENANT_ID, [""])).error).toBeTruthy();
      expect(applyTenantEnabledSkillsMock).not.toHaveBeenCalled();
    });
  });
});
