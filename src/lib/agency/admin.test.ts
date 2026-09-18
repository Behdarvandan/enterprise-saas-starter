// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireMembershipMock = vi.fn();
const requireMembershipResultMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/auth", () => ({
  requireMembership: requireMembershipMock,
  requireMembershipResult: requireMembershipResultMock,
}));

const { getAdministeredAgency, requireAgencyAdmin, requireAgencyAdminResult } = await import("./admin");

const AGENCY = {
  id: "agency-1",
  name: "Acme",
  cname_domain: null,
  cname_status: "pending",
  cname_verified_at: null,
  branding: {},
  master_tenant_id: "master-1",
  quota_pool: 1000,
};

function client(rpcResult: { data: unknown; error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(rpcResult);
  return { rpc } as unknown as Parameters<typeof getAdministeredAgency>[0] & { rpc: typeof rpc };
}

describe("getAdministeredAgency", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves through get_my_agency, not a direct table read", async () => {
    const supabase = client({ data: [AGENCY], error: null });

    expect(await getAdministeredAgency(supabase)).toEqual(AGENCY);
    expect(supabase.rpc).toHaveBeenCalledWith("get_my_agency");
  });

  it("returns null for a user who administers no agency", async () => {
    expect(await getAdministeredAgency(client({ data: [], error: null }))).toBeNull();
    expect(await getAdministeredAgency(client({ data: null, error: null }))).toBeNull();
  });

  it("fails closed (null) when the lookup errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await getAdministeredAgency(client({ data: null, error: { message: "boom" } }))).toBeNull();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("requireAgencyAdmin (pages)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the membership context plus the agency", async () => {
    const supabase = client({ data: [AGENCY], error: null });
    requireMembershipMock.mockResolvedValue({ supabase, user: { id: "u1" }, membership: { organizationId: "o1", role: "owner" } });

    const context = await requireAgencyAdmin();

    expect(context.agency).toEqual(AGENCY);
    expect(context.user.id).toBe("u1");
  });

  it("redirects a signed-in non-agency-admin to /dashboard", async () => {
    requireMembershipMock.mockResolvedValue({
      supabase: client({ data: [], error: null }),
      user: { id: "u1" },
      membership: { organizationId: "o1", role: "owner" },
    });

    await expect(requireAgencyAdmin()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });

  it("lets requireMembership's own redirect (signed out / no membership) through", async () => {
    requireMembershipMock.mockRejectedValue(new Error("NEXT_REDIRECT:/login"));
    await expect(requireAgencyAdmin()).rejects.toThrow("NEXT_REDIRECT:/login");
  });
});

describe("requireAgencyAdminResult (actions)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes a membership error through", async () => {
    requireMembershipResultMock.mockResolvedValue({ error: "You must be signed in." });
    expect(await requireAgencyAdminResult()).toEqual({ error: "You must be signed in." });
  });

  it("errors for a member who doesn't administer an agency", async () => {
    requireMembershipResultMock.mockResolvedValue({
      supabase: client({ data: [], error: null }),
      user: { id: "u1" },
      membership: { organizationId: "o1", role: "owner" },
    });
    expect(await requireAgencyAdminResult()).toEqual({ error: "You do not administer an agency." });
  });

  it("returns the context with the agency for an agency admin", async () => {
    requireMembershipResultMock.mockResolvedValue({
      supabase: client({ data: [AGENCY], error: null }),
      user: { id: "u1" },
      membership: { organizationId: "o1", role: "owner" },
    });
    const result = await requireAgencyAdminResult();
    expect("agency" in result && result.agency.id).toBe("agency-1");
  });
});
