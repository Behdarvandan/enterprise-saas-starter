import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase client for use in Server Components, Server Actions, and
 * Route Handlers. Cookie handling is wired to Next.js `cookies()`.
 *
 * If the request cookies can't be read the client is built without a
 * session (signed-out) rather than failing the whole render.
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseEnv();

  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch (error) {
    // Next.js signals dynamic rendering through exceptions; those must pass.
    unstable_rethrow(error);
    console.error("[supabase] cookies() unavailable, falling back to a signed-out client:", error);
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore?.getAll() ?? [];
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore?.set(name, value, options),
          );
        } catch {
          // Called from a Server Component where cookies cannot be set.
          // Safe to ignore when the middleware refreshes sessions.
        }
      },
    },
  });
}
