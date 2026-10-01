import { NextResponse } from "next/server";
import { createCoreServerClient } from "@/core/db";
import { sanitizeRedirectPath } from "@/lib/security";

/**
 * GET /api/auth/callback
 *
 * OAuth redirect target for signInWithOAuth (google/github/apple). Placed
 * under /api/ deliberately: src/middleware.ts's next-intl locale routing
 * excludes api/* but not a bare /auth/*, and an unprefixed /auth/callback
 * would get intercepted/locale-rewritten, which is wrong for a
 * provider-configured static redirect URI.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // `next` is attacker-controllable: only same-origin relative paths are honored.
  const next = sanitizeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createCoreServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed`);
}
