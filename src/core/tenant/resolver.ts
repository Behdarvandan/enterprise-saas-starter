import type { NextRequest } from "next/server";
import { AGENCY_CONTEXT_HEADER, encodeAgencyContext } from "@/lib/agency/branding";
import { getAgencyByDomain, isPlatformHost, normalizeHost } from "@/lib/agency/cname";

/**
 * Resolves the request's tenant (white-label agency) context and writes it
 * onto `request.headers` as `AGENCY_CONTEXT_HEADER`, so next-intl's response
 * (which clones `request.headers`) carries it to downstream Server
 * Components. Never trusts an inbound copy of the header: it is always
 * deleted first, so only a value resolved here can ever reach
 * `getAgencyContext()`.
 *
 * A Host outside the platform's own domains is looked up as an agency custom
 * domain (cached — see `lib/agency/cname.ts`). Unknown hosts, and any lookup
 * failure, fall through to the default Pasargad look: a branding lookup must
 * never take the whole site down.
 */
export async function resolveTenantContext(request: NextRequest): Promise<void> {
  request.headers.delete(AGENCY_CONTEXT_HEADER);

  try {
    const host = normalizeHost(request.headers.get("host"));
    if (host && !isPlatformHost(host)) {
      const agency = await getAgencyByDomain(host);
      if (agency) {
        request.headers.set(AGENCY_CONTEXT_HEADER, encodeAgencyContext(agency));
      }
    }
  } catch (error) {
    console.warn("[tenant] agency lookup failed, serving default branding:", error);
  }
}
