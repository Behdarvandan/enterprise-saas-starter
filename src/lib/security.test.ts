import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  safeEqualStrings,
  sanitizeRedirectPath,
  verifyBearerToken,
  verifyHmacSha256Hex,
} from "./security";

describe("safeEqualStrings", () => {
  it("matches equal strings and rejects different ones, including different lengths", () => {
    expect(safeEqualStrings("secret", "secret")).toBe(true);
    expect(safeEqualStrings("secret", "secreT")).toBe(false);
    expect(safeEqualStrings("secret", "secret-longer")).toBe(false);
    expect(safeEqualStrings("", "secret")).toBe(false);
  });
});

describe("verifyBearerToken", () => {
  it("accepts a matching bearer token", () => {
    expect(verifyBearerToken("Bearer s3cret", "s3cret")).toBe(true);
    expect(verifyBearerToken("bearer s3cret", "s3cret")).toBe(true);
  });

  it("rejects missing, malformed or wrong credentials", () => {
    expect(verifyBearerToken(null, "s3cret")).toBe(false);
    expect(verifyBearerToken("", "s3cret")).toBe(false);
    expect(verifyBearerToken("s3cret", "s3cret")).toBe(false);
    expect(verifyBearerToken("Basic s3cret", "s3cret")).toBe(false);
    expect(verifyBearerToken("Bearer wrong", "s3cret")).toBe(false);
  });

  it("never authorizes when the configured secret is empty", () => {
    expect(verifyBearerToken("Bearer ", "")).toBe(false);
    expect(verifyBearerToken("Bearer x", "")).toBe(false);
  });
});

describe("verifyHmacSha256Hex", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ hello: "world" });
  const signature = createHmac("sha256", secret).update(body).digest("hex");

  it("accepts a valid signature", () => {
    expect(verifyHmacSha256Hex(body, signature, secret)).toBe(true);
    expect(verifyHmacSha256Hex(body, signature.toUpperCase(), secret)).toBe(true);
  });

  it("rejects tampered bodies, bad signatures and missing inputs", () => {
    expect(verifyHmacSha256Hex(`${body} `, signature, secret)).toBe(false);
    expect(verifyHmacSha256Hex(body, "deadbeef", secret)).toBe(false);
    expect(verifyHmacSha256Hex(body, null, secret)).toBe(false);
    expect(verifyHmacSha256Hex(body, signature, "")).toBe(false);
  });
});

describe("sanitizeRedirectPath", () => {
  it("keeps same-origin relative paths", () => {
    expect(sanitizeRedirectPath("/dashboard/team")).toBe("/dashboard/team");
    expect(sanitizeRedirectPath("/tr/app?tab=1#x")).toBe("/tr/app?tab=1#x");
  });

  it("falls back for missing values", () => {
    expect(sanitizeRedirectPath(null)).toBe("/dashboard");
    expect(sanitizeRedirectPath(undefined, "/home")).toBe("/home");
    expect(sanitizeRedirectPath("")).toBe("/dashboard");
  });

  it.each([
    "@evil.example",
    "evil.example",
    "//evil.example",
    "/\\evil.example",
    "https://evil.example",
    "javascript:alert(1)",
    "/\t/evil.example",
    "/\n/evil.example",
  ])("rejects open-redirect payload %j", (payload) => {
    expect(sanitizeRedirectPath(payload)).toBe("/dashboard");
  });
});
