import { createBrowserClient } from "@supabase/ssr";
import type { GenericDatabase } from "@/core/db/types";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_ANON_KEY = "placeholder-key";

let warned = false;

function isValidHttpUrl(value: string): boolean {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/**
 * Supabase URL / anon key — duplicated from `@/lib/supabase/env.ts` rather
 * than imported, so `src/core/db/` stays free of `@/lib/*` (Pure Core rule).
 */
function getCoreSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (url && anonKey && isValidHttpUrl(url)) return { url, anonKey };

  if (!warned) {
    warned = true;
    console.warn(
      "[core/db] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid; " +
        "serving requests as signed-out until it is configured.",
    );
  }
  return { url: PLACEHOLDER_URL, anonKey: PLACEHOLDER_ANON_KEY };
}

/**
 * Supabase client for Client Components (browser). Kept in its own file,
 * separate from `createCoreServerClient` — that function's `next/headers`
 * import must never be reachable from a client bundle, including when a
 * top-level `"use client"` page (not just a nested component) imports this.
 */
export function createCoreBrowserClient<TDatabase = GenericDatabase>() {
  const { url, anonKey } = getCoreSupabaseEnv();
  return createBrowserClient<TDatabase>(url, anonKey);
}
