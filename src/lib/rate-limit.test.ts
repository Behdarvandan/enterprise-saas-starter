import { beforeEach, describe, expect, it, vi } from "vitest";

const limitMock = vi.fn();

vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: () => ({}) },
}));

vi.mock("@upstash/ratelimit", () => {
  class MockRatelimit {
    limit = limitMock;
    static slidingWindow = () => ({});
  }
  return { Ratelimit: MockRatelimit };
});

const { checkRateLimit } = await import("./rate-limit");

describe("checkRateLimit", () => {
  beforeEach(() => {
    limitMock.mockReset();
  });

  it("allows the request when the limiter reports success", async () => {
    limitMock.mockResolvedValue({ success: true });
    await expect(checkRateLimit("key")).resolves.toBe(true);
  });

  it("rejects the request when the limiter reports failure", async () => {
    limitMock.mockResolvedValue({ success: false });
    await expect(checkRateLimit("key")).resolves.toBe(false);
  });

  it("fails open (allows the request) when Redis is unreachable", async () => {
    limitMock.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(checkRateLimit("key")).resolves.toBe(true);
  });
});
