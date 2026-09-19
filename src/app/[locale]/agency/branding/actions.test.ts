// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const AGENCY_ID = "99999999-0000-0000-0000-000000000009";

const requireAgencyAdminResultMock = vi.fn();
const revalidatePathMock = vi.fn();
const logAgencyAuditMock = vi.fn();
const invalidateMock = vi.fn();
const updateMock = vi.fn();
const eqMock = vi.fn();

vi.mock("next-intl/server", async () => (await import("@/test/intl")).nextIntlServerMock());
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/agency/admin", () => ({ requireAgencyAdminResult: requireAgencyAdminResultMock }));
vi.mock("@/lib/agency/audit", () => ({ logAgencyAudit: logAgencyAuditMock }));
// The real hostname/platform-host rules are needed by the schema; only the
// cache invalidation (Redis) is replaced.
vi.mock("@/lib/agency/cname", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/agency/cname")>()),
  invalidateAgencyDomainCache: invalidateMock,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      update: (values: unknown) => {
        updateMock(table, values);
        return { eq: eqMock };
      },
    }),
  }),
}));

const { updateAgencyBranding } = await import("./actions");

function signInAs(agency: Record<string, unknown> = {}) {
  requireAgencyAdminResultMock.mockResolvedValue({
    user: { id: "user-1" },
    agency: {
      id: AGENCY_ID,
      master_tenant_id: "master-1",
      cname_domain: null,
      branding: {},
      ...agency,
    },
  });
}

function form(fields: Partial<Record<"title" | "logo_url" | "primary_color" | "cname_domain", string>>) {
  const data = new FormData();
  for (const key of ["title", "logo_url", "primary_color", "cname_domain"] as const) {
    data.set(key, fields[key] ?? "");
  }
  return data;
}

describe("updateAgencyBranding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    eqMock.mockResolvedValue({ error: null });
  });

  it("returns the guard's error for a non-agency-admin and writes nothing", async () => {
    requireAgencyAdminResultMock.mockResolvedValue({ error: "You do not administer an agency." });

    expect(await updateAgencyBranding(form({ title: "Acme" }))).toEqual({
      error: "You do not administer an agency.",
    });
    expect(updateMock).not.toHaveBeenCalled();
    expect(invalidateMock).not.toHaveBeenCalled();
  });

  it("reports each invalid field individually and writes nothing", async () => {
    signInAs();

    const result = await updateAgencyBranding(
      form({
        logo_url: "javascript:alert(1)",
        primary_color: "red",
        cname_domain: "pasargad.app",
      }),
    );

    expect(result.success).toBeUndefined();
    expect(result.fieldErrors).toMatchObject({
      logo_url: expect.any(String),
      primary_color: expect.any(String),
      cname_domain: expect.stringMatching(/platform/i),
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("writes only branding when the domain is unchanged, pinned to the caller's agency", async () => {
    signInAs({ cname_domain: "ai.acme.com", branding: { title: "Old" } });

    const result = await updateAgencyBranding(
      form({ title: "Acme AI", primary_color: "#7C3AED", cname_domain: "AI.Acme.com" }),
    );

    expect(result).toEqual({ success: true, domainChanged: false });
    expect(updateMock).toHaveBeenCalledTimes(1);
    const [table, values] = updateMock.mock.calls[0];
    expect(table).toBe("agencies");
    expect(values).toEqual({ branding: { title: "Acme AI", primary_color: "#7c3aed" } });
    expect(values).not.toHaveProperty("cname_domain");
    expect(eqMock).toHaveBeenCalledWith("id", AGENCY_ID);
  });

  it("preserves unknown branding keys and removes fields the admin cleared", async () => {
    signInAs({
      branding: { title: "Old", logo_url: "https://cdn.acme.com/old.svg", theme_note: { keep: true }, primary_color: "#111111" },
    });

    await updateAgencyBranding(form({ title: "New", logo_url: "", primary_color: "#222222" }));

    const [, values] = updateMock.mock.calls[0];
    expect(values.branding).toEqual({ title: "New", theme_note: { keep: true }, primary_color: "#222222" });
  });

  it("saves a changed domain, flags it for re-verification, and drops both cache entries", async () => {
    signInAs({ cname_domain: "old.acme.com" });

    const result = await updateAgencyBranding(form({ title: "Acme", cname_domain: "https://New.Acme.com/" }));

    expect(result).toEqual({ success: true, domainChanged: true });
    expect(updateMock.mock.calls[0][1]).toMatchObject({ cname_domain: "new.acme.com" });
    expect(invalidateMock).toHaveBeenCalledWith("old.acme.com");
    expect(invalidateMock).toHaveBeenCalledWith("new.acme.com");
    expect(revalidatePathMock).toHaveBeenCalledWith("/agency/branding");
  });

  it("clears the domain when the field is emptied", async () => {
    signInAs({ cname_domain: "ai.acme.com" });

    const result = await updateAgencyBranding(form({ title: "Acme" }));

    expect(result.domainChanged).toBe(true);
    expect(updateMock.mock.calls[0][1]).toMatchObject({ cname_domain: null });
    expect(invalidateMock).toHaveBeenCalledWith("ai.acme.com");
    expect(invalidateMock).toHaveBeenCalledTimes(1);
  });

  it("points a duplicate domain out on the field itself", async () => {
    signInAs();
    eqMock.mockResolvedValue({ error: { code: "23505", message: 'duplicate key value violates unique constraint "agencies_cname_domain_key"' } });

    const result = await updateAgencyBranding(form({ cname_domain: "ai.taken.com" }));

    expect(result.success).toBeUndefined();
    expect(result.fieldErrors?.cname_domain).toMatch(/another agency/i);
    expect(logAgencyAuditMock).not.toHaveBeenCalled();
    expect(invalidateMock).not.toHaveBeenCalled();
  });

  it("hides unexpected database errors", async () => {
    signInAs();
    eqMock.mockResolvedValue({ error: { code: "XX000", message: "internal detail" } });

    const result = await updateAgencyBranding(form({ title: "Acme" }));

    expect(result.error).toBe("Something went wrong. Please try again.");
    expect(JSON.stringify(result)).not.toContain("internal detail");
  });

  it("audits a successful save", async () => {
    signInAs();

    await updateAgencyBranding(form({ title: "Acme" }));

    expect(logAgencyAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "agency.branding_updated",
        actorId: "user-1",
        targetId: AGENCY_ID,
      }),
    );
  });
});
