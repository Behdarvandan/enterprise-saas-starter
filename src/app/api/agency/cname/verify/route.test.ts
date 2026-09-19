// @vitest-environment node
import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const AGENCY_ID = "99999999-0000-0000-0000-000000000009";

const requireMembershipMock = vi.fn();
const checkRateLimitMock = vi.fn();
const verifyCnameRecordMock = vi.fn();
const invalidateMock = vi.fn();
const maybeSingleMock = vi.fn();
const updateEqMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireMembershipOrResponse: requireMembershipMock }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: checkRateLimitMock }));
vi.mock("@/lib/agency/cname", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/agency/cname")>()),
  verifyCnameRecord: verifyCnameRecordMock,
  invalidateAgencyDomainCache: invalidateMock,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      update: (values: unknown) => {
        updateMock(table, values);
        return { eq: updateEqMock };
      },
    }),
  }),
}));

const { DnsLookupError } = await import("@/lib/agency/cname");
const { POST } = await import("./route");

function userClient() {
  return {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
    }),
  };
}

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/agency/cname/verify", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/agency/cname/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    requireMembershipMock.mockResolvedValue({ supabase: userClient(), user: { id: "user-1" } });
    checkRateLimitMock.mockResolvedValue(true);
    maybeSingleMock.mockResolvedValue({
      data: { id: AGENCY_ID, cname_domain: "ai.acme.com" },
      error: null,
    });
    updateEqMock.mockResolvedValue({ error: null });
  });

  it("returns the auth response untouched when not signed in", async () => {
    const denied = NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    requireMembershipMock.mockResolvedValue({ response: denied });

    const response = await post({ agencyId: AGENCY_ID });

    expect(response.status).toBe(401);
    expect(verifyCnameRecordMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid agencyId", async () => {
    expect((await post({ agencyId: "nope" })).status).toBe(400);
    expect((await post({})).status).toBe(400);
  });

  it("rate limits per user", async () => {
    checkRateLimitMock.mockResolvedValue(false);

    expect((await post({ agencyId: AGENCY_ID })).status).toBe(429);
    expect(checkRateLimitMock).toHaveBeenCalledWith("agency-cname-verify:user-1");
    expect(verifyCnameRecordMock).not.toHaveBeenCalled();
  });

  it("404s when RLS hides the agency from the caller", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    expect((await post({ agencyId: AGENCY_ID })).status).toBe(404);
    expect(verifyCnameRecordMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("400s when the agency has no custom domain", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { id: AGENCY_ID, cname_domain: null },
      error: null,
    });

    expect((await post({ agencyId: AGENCY_ID })).status).toBe(400);
    expect(verifyCnameRecordMock).not.toHaveBeenCalled();
  });

  it("records an active verdict with a verified timestamp and drops the cache entry", async () => {
    verifyCnameRecordMock.mockResolvedValue({
      status: "active",
      target: "cname.pasargad.app",
      records: ["cname.pasargad.app"],
    });

    const response = await post({ agencyId: AGENCY_ID });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "active",
      domain: "ai.acme.com",
      target: "cname.pasargad.app",
      records: ["cname.pasargad.app"],
      checkedAt: expect.any(String),
    });
    expect(updateMock).toHaveBeenCalledWith("agencies", {
      cname_status: "active",
      cname_verified_at: expect.any(String),
    });
    // The check state is a second, separate write (see the migration note in the route).
    expect(updateMock).toHaveBeenCalledWith("agencies", {
      cname_last_checked_at: expect.any(String),
      cname_last_records: ["cname.pasargad.app"],
    });
    expect(updateEqMock).toHaveBeenCalledWith("id", AGENCY_ID);
    expect(invalidateMock).toHaveBeenCalledWith("ai.acme.com");
  });

  it.each(["pending", "failed"] as const)("records a %s verdict without a timestamp", async (status) => {
    verifyCnameRecordMock.mockResolvedValue({ status, target: "cname.pasargad.app", records: [] });

    const response = await post({ agencyId: AGENCY_ID });

    expect((await response.json()).status).toBe(status);
    expect(updateMock).toHaveBeenCalledWith("agencies", {
      cname_status: status,
      cname_verified_at: null,
    });
  });

  it("returns 502 and leaves the stored status alone when DNS can't be queried", async () => {
    verifyCnameRecordMock.mockRejectedValue(new DnsLookupError("resolver down"));

    expect((await post({ agencyId: AGENCY_ID })).status).toBe(502);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns a generic 500 when recording the verdict fails", async () => {
    verifyCnameRecordMock.mockResolvedValue({
      status: "active",
      target: "cname.pasargad.app",
      records: [],
    });
    updateEqMock.mockResolvedValue({ error: { message: "db down" } });

    const response = await post({ agencyId: AGENCY_ID });

    expect(response.status).toBe(500);
    expect(invalidateMock).not.toHaveBeenCalled();
  });
});
