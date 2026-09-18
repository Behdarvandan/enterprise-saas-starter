// @vitest-environment node
import { NextRequest, type NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { decodeAgencyContext, type AgencyContext } from "@/lib/agency/branding";

const getAgencyByDomainMock = vi.fn();
const updateSessionMock = vi.fn(async (_request: NextRequest, response?: NextResponse) => response);

vi.mock("@/lib/agency/cname", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/agency/cname")>()),
  getAgencyByDomain: getAgencyByDomainMock,
}));

// The Supabase session refresh isn't under test; pass the response through.
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: updateSessionMock,
}));

// Real next-intl routing is used on purpose: the agency header only reaches
// downstream if next-intl's response clones it from `request.headers`.
const { middleware } = await import("./middleware");

const AGENCY: AgencyContext = {
  id: "99999999-0000-0000-0000-000000000009",
  masterTenantId: "11111111-0000-0000-0000-000000000001",
  branding: { title: "Acme AI", primary_color: "#7c3aed" },
};

// How Next.js forwards request-header overrides set by middleware.
const FORWARDED = "x-middleware-request-x-agency-context";

async function run(host: string, path = "/pricing", headers: Record<string, string> = {}) {
  const request = new NextRequest(`http://${host}${path}`, { headers: { host, ...headers } });
  return middleware(request) as Promise<NextResponse>;
}

describe("middleware white-label routing", () => {
  beforeEach(() => {
    getAgencyByDomainMock.mockReset();
    updateSessionMock.mockClear();
  });

  it("forwards the resolved agency to downstream routes on a custom domain", async () => {
    getAgencyByDomainMock.mockResolvedValue(AGENCY);

    const response = await run("AI.Acme.com:443");

    expect(getAgencyByDomainMock).toHaveBeenCalledWith("ai.acme.com");
    expect(decodeAgencyContext(response.headers.get(FORWARDED))).toEqual(AGENCY);
    expect(response.headers.get("x-middleware-override-headers")).toContain("x-agency-context");
  });

  it("does not look anything up on the platform's own domains", async () => {
    for (const host of ["localhost:3000", "pasargad.app", "www.pasargad.app", "x.vercel.app"]) {
      const response = await run(host);
      expect(response.headers.get(FORWARDED)).toBeNull();
    }
    expect(getAgencyByDomainMock).not.toHaveBeenCalled();
  });

  it("strips a client-supplied agency header on platform domains", async () => {
    const spoofed = "%7B%22id%22%3A%22x%22%2C%22masterTenantId%22%3A%22y%22%2C%22branding%22%3A%7B%7D%7D";

    const response = await run("pasargad.app", "/pricing", { "x-agency-context": spoofed });

    expect(response.headers.get(FORWARDED)).toBeNull();
  });

  it("strips a client-supplied agency header on an unknown custom domain", async () => {
    getAgencyByDomainMock.mockResolvedValue(null);

    const response = await run("unverified.example.com", "/pricing", {
      "x-agency-context": "spoofed",
    });

    expect(response.headers.get(FORWARDED)).toBeNull();
  });

  it("overwrites a spoofed header with the real agency on a custom domain", async () => {
    getAgencyByDomainMock.mockResolvedValue(AGENCY);

    const response = await run("ai.acme.com", "/pricing", { "x-agency-context": "spoofed" });

    expect(decodeAgencyContext(response.headers.get(FORWARDED))).toEqual(AGENCY);
  });

  it("serves the default look instead of failing when the lookup throws", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    getAgencyByDomainMock.mockRejectedValue(new Error("unexpected"));

    const response = await run("ai.acme.com");

    expect(response.status).toBe(200);
    expect(response.headers.get(FORWARDED)).toBeNull();
    warn.mockRestore();
  });

  it("keeps locale routing intact on a custom domain", async () => {
    getAgencyByDomainMock.mockResolvedValue(AGENCY);

    const rewritten = await run("ai.acme.com", "/pricing");
    expect(rewritten.headers.get("x-middleware-rewrite")).toContain("/en/pricing");

    // An already-prefixed non-default locale needs no rewrite, and the agency
    // header must still travel with it.
    const prefixed = await run("ai.acme.com", "/tr/pricing");
    expect(prefixed.headers.get("x-middleware-rewrite")).toBeNull();
    expect(decodeAgencyContext(prefixed.headers.get(FORWARDED))).toEqual(AGENCY);
    expect(prefixed.headers.get("x-middleware-request-x-next-intl-locale")).toBe("tr");
  });
});

describe("middleware safe fallback", () => {
  beforeEach(() => {
    getAgencyByDomainMock.mockReset();
    updateSessionMock.mockReset();
    updateSessionMock.mockRejectedValue(new Error("boom"));
  });

  it("rewrites an unprefixed path under the default locale instead of failing", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await run("pasargad.app", "/pricing");

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite")).toContain("/en/pricing");
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it("rewrites the root path to the default locale root", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await run("pasargad.app", "/");

    const rewrite = new URL(response.headers.get("x-middleware-rewrite") ?? "");
    expect(rewrite.pathname).toBe("/en");
    error.mockRestore();
  });

  it("passes an already-prefixed locale path through without redirecting", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await run("pasargad.app", "/tr/pricing");

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    error.mockRestore();
  });

  it("still strips a spoofed agency header when falling back", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await run("pasargad.app", "/tr/pricing", { "x-agency-context": "spoofed" });

    expect(response.headers.get(FORWARDED)).toBeNull();
    error.mockRestore();
  });
});
