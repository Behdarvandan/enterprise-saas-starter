import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import type { GenericDatabase } from "@/core/db/types";

type CookieToSet = { name: string; value: string; options: CookieOptions };

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
 * Supabase client for Server Components, Server Actions, and Route
 * Handlers, cookie-wired to Next.js `cookies()`. If request cookies can't be
 * read, the client is built signed-out rather than failing the render. Kept
 * in its own file, separate from `createCoreBrowserClient` — this file's
 * `next/headers` import must never be reachable from a client bundle.
 */
export async function createCoreServerClient<TDatabase = GenericDatabase>() {
  const { url, anonKey } = getCoreSupabaseEnv();

  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch (error) {
    unstable_rethrow(error);
    console.error("[core/db] cookies() unavailable, falling back to a signed-out client:", error);
  }

  return createServerClient<TDatabase>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore?.getAll() ?? [];
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore?.set(name, value, options));
        } catch {
          // Called from a Server Component where cookies cannot be set.
        }
      },
    },
  });
}
