// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.fn();

vi.mock("@/lib/supabase/anon", () => ({
  createAnonClient: () => ({
    rpc: (...args: unknown[]) => ({
      abortSignal: () => rpcMock(...args),
    }),
  }),
}));

// No Upstash env in these tests, so the Redis layer is skipped and the
// in-memory layer is what's under test.
vi.mock("@upstash/redis/cloudflare", () => ({ Redis: class {} }));

const {
  DnsLookupError,
  getAgencyByDomain,
  invalidateAgencyDomainCache,
  isPlatformHost,
  normalizeHost,
  verifyCnameRecord,
} = await import("./cname");

const ROW = {
  id: "99999999-0000-0000-0000-000000000009",
  master_tenant_id: "11111111-0000-0000-0000-000000000001",
  branding: { title: "Acme AI", primary_color: "#52525b", api_key: "sk-secret" },
};

describe("normalizeHost", () => {
  it("lowercases and strips port and trailing dot", () => {
    expect(normalizeHost("AI.Acme.com:3000")).toBe("ai.acme.com");
    expect(normalizeHost("ai.acme.com.")).toBe("ai.acme.com");
    expect(normalizeHost("[::1]:3000")).toBe("[::1]");
  });

  it("returns null for empty input", () => {
    expect(normalizeHost(null)).toBeNull();
    expect(normalizeHost("   ")).toBeNull();
  });
});

describe("isPlatformHost", () => {
  afterEach(() => {
    delete process.env.PLATFORM_DOMAINS;
  });

  it("treats the platform's own domains and subdomains as platform hosts", () => {
    for (const host of ["localhost", "pasargad.app", "www.pasargad.app", "app.pasargad.app"]) {
      expect(isPlatformHost(host)).toBe(true);
    }
  });

  it("treats dev/preview hosts and IP literals as platform hosts", () => {
    for (const host of ["foo.localhost", "my-branch.vercel.app", "127.0.0.1", "[::1]"]) {
      expect(isPlatformHost(host)).toBe(true);
    }
  });

  it("does not match lookalike or unrelated domains", () => {
    for (const host of ["evil-pasargad.app", "pasargad.app.evil.com", "ai.acme.com"]) {
      expect(isPlatformHost(host)).toBe(false);
    }
  });

  it("honors PLATFORM_DOMAINS", () => {
    process.env.PLATFORM_DOMAINS = "example.org, nimbus.io";
    expect(isPlatformHost("nimbus.io")).toBe(true);
    expect(isPlatformHost("app.example.org")).toBe(true);
    expect(isPlatformHost("pasargad.app")).toBe(false);
  });
});

describe("getAgencyByDomain", () => {
  beforeEach(async () => {
    rpcMock.mockReset();
    // Each test uses its own host, but clear anyway for the shared Map.
    await invalidateAgencyDomainCache("ai.acme.com");
    await invalidateAgencyDomainCache("nobody.example.com");
    await invalidateAgencyDomainCache("flaky.example.com");
  });

  it("resolves a verified domain, exposing only whitelisted branding", async () => {
    rpcMock.mockResolvedValue({ data: [ROW], error: null });

    const agency = await getAgencyByDomain("ai.acme.com");

    expect(rpcMock).toHaveBeenCalledWith("get_agency_by_domain", { p_domain: "ai.acme.com" });
    expect(agency).toEqual({
      id: ROW.id,
      masterTenantId: ROW.master_tenant_id,
      branding: { title: "Acme AI", primary_color: "#52525b" },
    });
  });

  it("serves repeat lookups from cache with a single RPC", async () => {
    rpcMock.mockResolvedValue({ data: [ROW], error: null });

    await getAgencyByDomain("ai.acme.com");
    await getAgencyByDomain("ai.acme.com");
    await getAgencyByDomain("ai.acme.com");

    expect(rpcMock).toHaveBeenCalledTimes(1);
  });

  it("caches unknown domains too (negative cache)", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });

    expect(await getAgencyByDomain("nobody.example.com")).toBeNull();
    expect(await getAgencyByDomain("nobody.example.com")).toBeNull();

    expect(rpcMock).toHaveBeenCalledTimes(1);
  });

  it("fails open on an RPC error and does not cache the failure", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    rpcMock.mockResolvedValueOnce({ data: [ROW], error: null });

    expect(await getAgencyByDomain("flaky.example.com")).toBeNull();
    expect(await getAgencyByDomain("flaky.example.com")).not.toBeNull();

    expect(rpcMock).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it("re-queries after the cache entry is invalidated", async () => {
    rpcMock.mockResolvedValue({ data: [ROW], error: null });

    await getAgencyByDomain("ai.acme.com");
    await invalidateAgencyDomainCache("ai.acme.com");
    await getAgencyByDomain("ai.acme.com");

    expect(rpcMock).toHaveBeenCalledTimes(2);
  });

  it("never queries for an invalid hostname", async () => {
    expect(await getAgencyByDomain("not a host")).toBeNull();
    expect(await getAgencyByDomain("localhost")).toBeNull();
    expect(rpcMock).not.toHaveBeenCalled();
  });
});

describe("verifyCnameRecord", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.CNAME_TARGET;
  });

  function dnsResponse(body: unknown, ok = true, status = 200) {
    return { ok, status, json: async () => body };
  }

  it("is active when a CNAME points at the target (case/trailing dot insensitive)", async () => {
    fetchMock.mockResolvedValue(
      dnsResponse({ Status: 0, Answer: [{ type: 5, data: "CNAME.Pasargad.app." }] }),
    );

    await expect(verifyCnameRecord("ai.acme.com")).resolves.toEqual({
      status: "active",
      target: "cname.pasargad.app",
      records: ["cname.pasargad.app"],
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://cloudflare-dns.com/dns-query?name=ai.acme.com&type=CNAME");
    expect(init.headers.accept).toBe("application/dns-json");
  });

  it("is active when the target is reached through a CNAME chain", async () => {
    fetchMock.mockResolvedValue(
      dnsResponse({
        Status: 0,
        Answer: [
          { type: 5, data: "edge.hosting.example." },
          { type: 5, data: "cname.pasargad.app." },
        ],
      }),
    );
    expect((await verifyCnameRecord("ai.acme.com")).status).toBe("active");
  });

  it("is pending when there is no CNAME yet (empty answer or NXDOMAIN)", async () => {
    fetchMock.mockResolvedValueOnce(dnsResponse({ Status: 0 }));
    expect((await verifyCnameRecord("ai.acme.com")).status).toBe("pending");

    fetchMock.mockResolvedValueOnce(dnsResponse({ Status: 3 }));
    expect((await verifyCnameRecord("ai.acme.com")).status).toBe("pending");

    // Only A records present: still no CNAME.
    fetchMock.mockResolvedValueOnce(
      dnsResponse({ Status: 0, Answer: [{ type: 1, data: "203.0.113.7" }] }),
    );
    expect((await verifyCnameRecord("ai.acme.com")).status).toBe("pending");
  });

  it("fails when the CNAME points somewhere else", async () => {
    fetchMock.mockResolvedValue(
      dnsResponse({ Status: 0, Answer: [{ type: 5, data: "other.example.net." }] }),
    );
    await expect(verifyCnameRecord("ai.acme.com")).resolves.toMatchObject({
      status: "failed",
      records: ["other.example.net"],
    });
  });

  it("honors CNAME_TARGET", async () => {
    process.env.CNAME_TARGET = "Edge.Nimbus.io.";
    fetchMock.mockResolvedValue(
      dnsResponse({ Status: 0, Answer: [{ type: 5, data: "edge.nimbus.io." }] }),
    );
    await expect(verifyCnameRecord("ai.acme.com")).resolves.toMatchObject({
      status: "active",
      target: "edge.nimbus.io",
    });
  });

  it("fails an invalid hostname without querying DNS", async () => {
    await expect(verifyCnameRecord("not a host")).resolves.toMatchObject({ status: "failed" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws DnsLookupError when DNS can't be queried", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNRESET"));
    await expect(verifyCnameRecord("ai.acme.com")).rejects.toBeInstanceOf(DnsLookupError);

    fetchMock.mockResolvedValueOnce(dnsResponse({}, false, 503));
    await expect(verifyCnameRecord("ai.acme.com")).rejects.toBeInstanceOf(DnsLookupError);

    fetchMock.mockResolvedValueOnce(dnsResponse({ Status: 2 })); // SERVFAIL
    await expect(verifyCnameRecord("ai.acme.com")).rejects.toBeInstanceOf(DnsLookupError);

    fetchMock.mockResolvedValueOnce(dnsResponse({ unexpected: true }));
    await expect(verifyCnameRecord("ai.acme.com")).rejects.toBeInstanceOf(DnsLookupError);
  });
});
