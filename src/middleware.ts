import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { AGENCY_CONTEXT_HEADER, encodeAgencyContext } from "@/lib/agency/branding";
import { getAgencyByDomain, isPlatformHost, normalizeHost } from "@/lib/agency/cname";
import { updateSession } from "@/lib/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

/**
 * Last-resort response when locale routing itself failed. It must not
 * redirect: redirecting to a locale that is the one failing would loop.
 * An already-prefixed locale path is served as-is; anything else is
 * rewritten under the default locale (matching `localePrefix: "as-needed"`).
 * The request headers are forwarded so the agency context still arrives.
 */
function getSafeFallbackResponse(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const [, firstSegment] = pathname.split("/");

  if (hasLocale(routing.locales, firstSegment)) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${routing.defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url, { request: { headers: request.headers } });
}

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
  try {
    const host = normalizeHost(request.headers.get("host"));
    if (host && !isPlatformHost(host)) {
      const agency = await getAgencyByDomain(host);
      if (agency) {
        request.headers.set(AGENCY_CONTEXT_HEADER, encodeAgencyContext(agency));
      }
    }
  } catch (error) {
    // A branding lookup must never take the whole site down: serve the
    // default look instead.
    console.warn("[middleware] agency lookup failed, serving default branding:", error);
  }

  // next-intl runs first to resolve/redirect on locale; its response is then
  // handed to updateSession so the Supabase cookie refresh lands on top of
  // it instead of a fresh response that would drop the locale redirect.
  try {
    const response = handleI18nRouting(request);
    return await updateSession(request, response);
  } catch (error) {
    // An unhandled throw here is a 500 for every page: degrade to the
    // default-locale routing instead.
    console.error("[middleware] locale routing failed, using safe fallback:", error);
    return getSafeFallbackResponse(request);
  }
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
