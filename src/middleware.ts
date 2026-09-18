import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { AGENCY_CONTEXT_HEADER, encodeAgencyContext } from "@/lib/agency/branding";
import { getAgencyByDomain, isPlatformHost, normalizeHost } from "@/lib/agency/cname";
import { updateSession } from "@/lib/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Never trust an inbound copy of the agency header: only a value written
  // below may reach downstream Server Components (a client could otherwise
  // spoof another agency's branding on any domain).
  request.headers.delete(AGENCY_CONTEXT_HEADER);

  // White-label routing: a Host outside the platform's own domains is looked
  // up as an agency custom domain (cached, see lib/agency/cname.ts). The
  // header is set on the request *before* next-intl runs, since next-intl
  // clones request.headers into the response's request overrides. Unknown
  // hosts fall through to the default Pasargad look.
  const host = normalizeHost(request.headers.get("host"));
  if (host && !isPlatformHost(host)) {
    try {
      const agency = await getAgencyByDomain(host);
      if (agency) {
        request.headers.set(AGENCY_CONTEXT_HEADER, encodeAgencyContext(agency));
      }
    } catch (error) {
      // A branding lookup must never take the whole site down: serve the
      // default look instead.
      console.warn("[middleware] agency lookup failed, serving default branding:", error);
    }
  }

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
