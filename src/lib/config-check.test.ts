// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateProductionConfig } from "@/lib/config-check";

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

describe("validateProductionConfig", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("does nothing outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    REQUIRED.forEach((name) => vi.stubEnv(name, ""));

    expect(validateProductionConfig()).toEqual([]);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("logs the missing variables in production without throwing", () => {
    vi.stubEnv("NODE_ENV", "production");
    REQUIRED.forEach((name) => vi.stubEnv(name, ""));

    expect(() => validateProductionConfig()).not.toThrow();
    expect(validateProductionConfig()).toEqual(REQUIRED);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("STRIPE_SECRET_KEY"));
  });

  it("reports nothing when everything is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    REQUIRED.forEach((name) => vi.stubEnv(name, "set"));

    expect(validateProductionConfig()).toEqual([]);
  });
});
