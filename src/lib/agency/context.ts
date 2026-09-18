import { headers } from "next/headers";
import {
  AGENCY_CONTEXT_HEADER,
  decodeAgencyContext,
  type AgencyContext,
} from "@/lib/agency/branding";

/**
 * The agency the current request's custom domain resolved to, or `null` on
 * the platform's own domains. Server-only (reads request headers), and
 * trustworthy because `middleware.ts` strips any client-supplied copy of the
 * header before deciding what (if anything) to set.
 *
 * Reading request headers opts the calling route into dynamic rendering.
 */
export async function getAgencyContext(): Promise<AgencyContext | null> {
  const headersList = await headers();
  return decodeAgencyContext(headersList.get(AGENCY_CONTEXT_HEADER));
}
