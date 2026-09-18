import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/**
 * Refresh the authenticated session on each request by re-reading the
 * cookies and refreshing expired tokens when needed.
 *
 * Never throws: if Supabase is misconfigured or unreachable the request
 * continues with the response as-is (no refreshed cookies), so a Supabase
 * outage can't turn every page into a 500.
 */
export async function updateSession(request: NextRequest, response?: NextResponse) {
  // Build on top of the response passed in (e.g. next-intl's locale
  // redirect) instead of always starting from a fresh one, so cookies set
  // below don't discard a redirect decided upstream.
  let supabaseResponse = response ?? NextResponse.next({ request });

  try {
    const { url, anonKey } = getSupabaseEnv();
    const supabase = createServerClient<Database>(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    // IMPORTANT: keep this call to refresh the session on every request.
    await supabase.auth.getUser();
  } catch (error) {
    console.error("[middleware] Supabase session refresh failed, continuing without it:", error);
  }

  return supabaseResponse;
}
