import { afterEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: async () => ({ get: getMock }),
}));

const { getPricingRegion } = await import("./geo");

describe("getPricingRegion", () => {
  afterEach(() => {
    getMock.mockReset();
    vi.unstubAllEnvs();
  });

  it("resolves 'tr' for a Turkish IP", async () => {
    getMock.mockReturnValue("TR");
    await expect(getPricingRegion()).resolves.toBe("tr");
  });

  it("resolves 'eu' for a German IP", async () => {
    getMock.mockReturnValue("DE");
    await expect(getPricingRegion()).resolves.toBe("eu");
  });

  it("resolves 'global' for a non-EU, non-TR IP", async () => {
    getMock.mockReturnValue("US");
    await expect(getPricingRegion()).resolves.toBe("global");
  });

  it("resolves 'global' when the geo header is absent (e.g. local dev)", async () => {
    getMock.mockReturnValue(null);
    await expect(getPricingRegion()).resolves.toBe("global");
  });

  it("honors PRICING_REGION_OVERRIDE outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("PRICING_REGION_OVERRIDE", "tr");
    getMock.mockReturnValue("US");
    await expect(getPricingRegion()).resolves.toBe("tr");
  });

  it("ignores PRICING_REGION_OVERRIDE in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PRICING_REGION_OVERRIDE", "tr");
    getMock.mockReturnValue("US");
    await expect(getPricingRegion()).resolves.toBe("global");
  });
});
