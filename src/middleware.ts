import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // next-intl runs first to resolve/redirect on locale; its response is then
  // handed to updateSession so the Supabase cookie refresh lands on top of
  // it instead of a fresh response that would drop the locale redirect.
  const response = handleI18nRouting(request);
  return await updateSession(request, response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/* (route handlers create their own Supabase client and must
     *   never be intercepted by locale routing)
     * - _next/static, _next/image (static build assets)
     * - favicon.ico and other static files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
