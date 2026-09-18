import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  requireMembership,
  requireMembershipResult,
  type MembershipContext,
} from "@/lib/auth";
import type { Database } from "@/types/database";

/**
 * Agency-portal guards, the counterpart to `requireOperatorAdmin` in
 * src/lib/operator.ts. "Agency admin" is decided by Postgres
 * (`is_agency_admin()`, i.e. owner/admin of the agency's master
 * organization), never re-derived here.
 */

export type AdministeredAgency =
  Database["public"]["Functions"]["get_my_agency"]["Returns"][number];

/**
 * The agency the signed-in user administers, or `null` (not an agency admin,
 * or the lookup failed — fail closed). Goes through `get_my_agency()` rather
 * than reading `agencies` directly: the operator can see every agency under
 * RLS without administering any of them.
 *
 * A user who administers several agencies gets the oldest one.
 */
export async function getAdministeredAgency(
  supabase: SupabaseClient<Database>,
): Promise<AdministeredAgency | null> {
  const { data, error } = await supabase.rpc("get_my_agency");
  if (error) {
    console.error("Failed to resolve the caller's agency:", error);
    return null;
  }
  return data?.[0] ?? null;
}

export interface AgencyAdminContext extends MembershipContext {
  agency: AdministeredAgency;
}

/**
 * Server Component / page flavor: requires a signed-in member who administers
 * an agency, else redirects (`/login` signed out, `/dashboard` otherwise).
 * Layouts don't re-run on client-side navigation, so every agency page calls
 * this itself instead of relying on the layout's guard.
 */
export async function requireAgencyAdmin(): Promise<AgencyAdminContext> {
  const context = await requireMembership();

  const agency = await getAdministeredAgency(context.supabase);
  if (!agency) redirect("/dashboard");

  return { ...context, agency };
}

export type AgencyAdminResult = AgencyAdminContext | { error: string };

/** Server Action flavor of `requireAgencyAdmin`: returns `{ error }` on failure. */
export async function requireAgencyAdminResult(): Promise<AgencyAdminResult> {
  const context = await requireMembershipResult();
  if ("error" in context) return context;

  const agency = await getAdministeredAgency(context.supabase);
  if (!agency) return { error: "You do not administer an agency." };

  return { ...context, agency };
}
