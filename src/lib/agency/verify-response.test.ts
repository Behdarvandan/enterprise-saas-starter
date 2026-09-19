// @vitest-environment node
import { describe, expect, it } from "vitest";
import { normalizeCnameStatus, parseVerifyResponse, readVerifyErrorCode } from "./verify-response";

describe("parseVerifyResponse", () => {
  it("accepts the documented shape", () => {
    expect(
      parseVerifyResponse({
        status: "failed",
        domain: "ai.acme.com",
        target: "cname.pasargad.app",
        records: ["other.example.com"],
        checkedAt: "2026-09-19T10:00:00.000Z",
      }),
    ).toEqual({
      status: "failed",
      domain: "ai.acme.com",
      target: "cname.pasargad.app",
      records: ["other.example.com"],
      checkedAt: "2026-09-19T10:00:00.000Z",
    });
  });

  it("still parses a response without records/checkedAt", () => {
    expect(parseVerifyResponse({ status: "active", domain: "ai.acme.com", target: "cname.pasargad.app" })).toEqual({
      status: "active",
      domain: "ai.acme.com",
      target: "cname.pasargad.app",
      records: [],
      checkedAt: null,
    });
  });

  it("drops non-string records", () => {
    expect(parseVerifyResponse({ status: "pending", domain: "a.com", target: "t.com", records: ["ok", 5, null] })?.records).toEqual(["ok"]);
  });

  it.each([
    null,
    "active",
    {},
    { status: "bogus", domain: "a.com", target: "t.com" },
    { status: "active", domain: 1, target: "t.com" },
    { status: "active", domain: "a.com" },
  ])("rejects %j", (body) => {
    expect(parseVerifyResponse(body)).toBeNull();
  });
});

describe("readVerifyErrorCode", () => {
  it("prefers the route's own machine code", () => {
    expect(readVerifyErrorCode({ code: "not_found" }, 404)).toBe("not_found");
    expect(readVerifyErrorCode({ code: "dns_unreachable" }, 502)).toBe("dns_unreachable");
  });

  it("falls back per HTTP status, and to generic for anything unknown", () => {
    expect(readVerifyErrorCode(null, 429)).toBe("rate_limited");
    expect(readVerifyErrorCode({}, 502)).toBe("dns_unreachable");
    expect(readVerifyErrorCode({ code: "made_up" }, 500)).toBe("generic");
  });
});

describe("normalizeCnameStatus", () => {
  it("keeps valid statuses and defaults everything else to pending", () => {
    expect(normalizeCnameStatus("active")).toBe("active");
    expect(normalizeCnameStatus("failed")).toBe("failed");
    expect(normalizeCnameStatus("weird")).toBe("pending");
  });
});
