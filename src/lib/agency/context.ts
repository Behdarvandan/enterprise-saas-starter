import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
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
 * Branding is cosmetic, so any other failure resolves to `null` (default
 * look) rather than failing the layout render.
 */
export async function getAgencyContext(): Promise<AgencyContext | null> {
  try {
    const headersList = await headers();
    return decodeAgencyContext(headersList.get(AGENCY_CONTEXT_HEADER));
  } catch (error) {
    // Next.js signals dynamic rendering through exceptions; those must pass.
    unstable_rethrow(error);
    console.error("[agency] could not read the agency context, using default branding:", error);
    return null;
  }
}
