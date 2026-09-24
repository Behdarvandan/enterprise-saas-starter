import { createServerClient } from "@supabase/ssr";
import { hasLocale } from "next-intl";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { ACTIVE_ORG_COOKIE, pickActiveMembership } from "@/lib/team";
import type { Database } from "@/types/database";

const BILLING_PATH = "/dashboard/billing";

/** Splits a locale prefix (if any) off the pathname, e.g. "/tr/dashboard" -> { locale: "tr", rest: "/dashboard" }. */
function splitLocale(pathname: string): { locale: string | null; rest: string } {
  const [, first, ...restSegments] = pathname.split("/");
  if (hasLocale(routing.locales, first)) {
    return { locale: first, rest: `/${restSegments.join("/")}` };
  }
  return { locale: null, rest: pathname };
}

/** Mirrors SERVICEABLE_STATUSES/deriveAgentState in src/lib/dashboard/metrics.ts. */
function isServiceable(subscriptionStatus: string, trialEndsAt: string | null): boolean {
  if (subscriptionStatus === "active") return true;
  if (subscriptionStatus === "trialing") {
    return !trialEndsAt || new Date(trialEndsAt).getTime() > Date.now();
  }
  return false;
}

/**
 * Redirects to /dashboard/billing when the visiting user's active
 * organization has an expired trial or an inactive/past_due/canceled
 * subscription. Only gates /dashboard/** (excluding /dashboard/billing
 * itself, to avoid a redirect loop) — never throws: any failure degrades to
 * the untouched response, mirroring updateSession's fail-open contract, so a
 * Supabase outage can't lock every user out of the dashboard.
 */
export async function applySubscriptionGate(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  const { locale, rest } = splitLocale(request.nextUrl.pathname);
  if (!rest.startsWith("/dashboard") || rest.startsWith(BILLING_PATH)) {
    return response;
  }

  try {
    const { url, anonKey } = getSupabaseEnv();
    const supabase = createServerClient<Database>(url, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {
          // Read-only client: updateSession() already refreshed the session
          // cookies earlier in the middleware pipeline.
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return response;

    const { data: rows } = await supabase
      .from("memberships")
      .select("organization_id, role, organizations(subscription_status, trial_ends_at)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!rows || rows.length === 0) return response;

    const activeOrganizationId = request.cookies.get(ACTIVE_ORG_COOKIE)?.value;
    const active = pickActiveMembership(rows, activeOrganizationId);
    const organization = rows.find((row) => row.organization_id === active?.organizationId)?.organizations;
    if (!organization) return response;

    if (isServiceable(organization.subscription_status, organization.trial_ends_at)) {
      return response;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = locale ? `/${locale}${BILLING_PATH}` : BILLING_PATH;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[middleware] subscription gate failed, continuing without it:", error);
    return response;
  }
}
