// @vitest-environment node
import { describe, expect, it } from "vitest";
import { normalizeCnameStatus, parseVerifyResponse, readVerifyError } from "./verify-response";

describe("parseVerifyResponse", () => {
  it("accepts the documented shape", () => {
    expect(parseVerifyResponse({ status: "active", domain: "ai.acme.com", target: "cname.pasargad.app" })).toEqual({
      status: "active",
      domain: "ai.acme.com",
      target: "cname.pasargad.app",
    });
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

describe("readVerifyError", () => {
  it("prefers the route's own message", () => {
    expect(readVerifyError({ error: "Agency not found." }, 404)).toBe("Agency not found.");
  });

  it("falls back per status", () => {
    expect(readVerifyError(null, 429)).toMatch(/too many/i);
    expect(readVerifyError({ error: "" }, 500)).toMatch(/try again/i);
  });
});

describe("normalizeCnameStatus", () => {
  it("keeps valid statuses and defaults everything else to pending", () => {
    expect(normalizeCnameStatus("active")).toBe("active");
    expect(normalizeCnameStatus("failed")).toBe("failed");
    expect(normalizeCnameStatus("weird")).toBe("pending");
  });
});
