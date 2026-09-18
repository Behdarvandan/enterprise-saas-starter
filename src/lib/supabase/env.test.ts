// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

async function loadGetSupabaseEnv() {
  // The "warn once" flag is module state, so each test gets a fresh module.
  vi.resetModules();
  return (await import("@/lib/supabase/env")).getSupabaseEnv;
}

describe("getSupabaseEnv", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("returns the configured values untouched", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const getSupabaseEnv = await loadGetSupabaseEnv();

    expect(getSupabaseEnv()).toEqual({ url: "https://abc.supabase.co", anonKey: "anon-key" });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("falls back to placeholders when the variables are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const getSupabaseEnv = await loadGetSupabaseEnv();

    expect(getSupabaseEnv().url).toBe("https://placeholder.supabase.co");
    expect(getSupabaseEnv().anonKey).toBe("placeholder-key");
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it.each(["   ", "not a url", "ftp://abc.supabase.co"])(
    "falls back to placeholders for the invalid URL %j",
    async (url) => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = url;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

      const getSupabaseEnv = await loadGetSupabaseEnv();

      expect(getSupabaseEnv().url).toBe("https://placeholder.supabase.co");
    },
  );
});
