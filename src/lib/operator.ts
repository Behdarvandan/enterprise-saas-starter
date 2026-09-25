import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import {
  requireUser,
  requireUserResult,
  requireUserOrResponse,
  type AuthContext,
} from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Shared "is this user the operator (freelancer/business owner), not a
 * tenant client or customer" guard — the counterpart to `requireMembership`
 * in src/lib/auth.ts, scoped narrowly to just what the admin portal needs.
 * Authorization itself never leaves Postgres: `is_operator_admin()` is a
 * SECURITY DEFINER RPC that checks `current_user_role()` against the single
 * organization recorded in `platform_settings`, so this file only wires the
 * existing RLS primitives into the same three call-site flavors already
 * used by src/lib/auth.ts.
 */

/**
 * Resolves the operator organization's id — the one organization that
 * represents the freelancer/operator's own business, as opposed to a
 * freelance client's or SaaS customer's tenant org. Uses the service-role
 * client since this is a system-level lookup (not tenant data), and some
 * callers (e.g. the public lead-intake form) have no membership at all.
 */
export async function getOperatorOrganizationId(): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("operator_organization_id")
    .maybeSingle();

  return data?.operator_organization_id ?? null;
}

export type OperatorContext = AuthContext;

// --- Server Components / pages: redirects on failure -----------------------

/**
 * Resolves the signed-in user as an operator admin, or redirects
 * (`/login` when signed out, `/dashboard` when signed in but not an
 * owner/admin of the operator organization).
 */
export async function requireOperatorAdmin(): Promise<OperatorContext> {
  const context = await requireUser();
  const { data: isOperatorAdmin } = await context.supabase.rpc(
    "is_operator_admin",
  );

  if (!isOperatorAdmin) redirect("/dashboard");

  return context;
}

// --- Server Actions: returns a `{ error }` result on failure ----------------

export type OperatorResult = OperatorContext | { error: string };

/**
 * Server Action flavor of `requireOperatorAdmin`: resolves the signed-in
 * operator admin, or an `{ error }` result to return as-is.
 */
export async function requireOperatorAdminResult(): Promise<OperatorResult> {
  const result = await requireUserResult();
  if ("error" in result) return result;

  const { data: isOperatorAdmin } = await result.supabase.rpc("is_operator_admin");
  if (!isOperatorAdmin) {
    return { error: (await getTranslations("errors"))("forbidden") };
  }

  return result;
}

// --- Route Handlers: returns a `NextResponse` on failure --------------------

export type OperatorResponse = OperatorContext | { response: NextResponse };

/**
 * Route Handler flavor of `requireOperatorAdmin`: resolves the signed-in
 * operator admin, or a `NextResponse` (401 signed-out, 403 not an operator
 * admin) to return as-is.
 */
export async function requireOperatorAdminOrResponse(): Promise<OperatorResponse> {
  const result = await requireUserOrResponse();
  if ("response" in result) return result;

  const { data: isOperatorAdmin } = await result.supabase.rpc(
    "is_operator_admin",
  );
  if (!isOperatorAdmin) {
    return {
      response: NextResponse.json(
        { error: "Operator admin access required." },
        { status: 403 },
      ),
    };
  }

  return result;
}
