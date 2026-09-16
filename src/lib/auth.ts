import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getUserMembership, type UserMembership } from "@/lib/team";
import type { Database } from "@/types/database";

/**
 * Shared "who is signed in, and what is their membership" guard, in three
 * flavors matching the three places it gets checked in this codebase:
 * Server Components/pages redirect, Server Actions return a result object,
 * and Route Handlers return an HTTP response. Each flavor resolves the same
 * underlying `supabase.auth.getUser()` + `getUserMembership()` pair so the
 * check itself is defined once.
 */

export interface AuthContext {
  supabase: SupabaseClient<Database>;
  user: User;
}

export interface MembershipContext extends AuthContext {
  membership: UserMembership;
}

// --- Server Components / pages: redirects on failure -----------------------

/** Resolves the signed-in user, or redirects to `/login`. */
export async function requireUser(): Promise<AuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { supabase, user };
}

/**
 * Resolves the signed-in user's organization membership, or redirects
 * (`/login` when signed out, `/dashboard` when the user has no membership).
 */
export async function requireMembership(): Promise<MembershipContext> {
  const { supabase, user } = await requireUser();

  const membership = await getUserMembership(user.id);
  if (!membership) redirect("/dashboard");

  return { supabase, user, membership };
}

// --- Server Actions: returns a `{ error }` result on failure ----------------

export type AuthResult = AuthContext | { error: string };
export type MembershipResult = MembershipContext | { error: string };

/** Resolves the signed-in user, or an `{ error }` result to return as-is. */
export async function requireUserResult(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  return { supabase, user };
}

/**
 * Resolves the signed-in user's organization membership, or an `{ error }`
 * result to return as-is.
 */
export async function requireMembershipResult(): Promise<MembershipResult> {
  const result = await requireUserResult();
  if ("error" in result) return result;

  const membership = await getUserMembership(result.user.id);
  if (!membership) return { error: "You do not belong to an organization." };

  return { ...result, membership };
}

// --- Route Handlers: returns a `NextResponse` on failure --------------------

export type AuthResponse = AuthContext | { response: NextResponse };
export type MembershipResponse = MembershipContext | { response: NextResponse };

/** Resolves the signed-in user, or a 401 `NextResponse` to return as-is. */
export async function requireUserOrResponse(): Promise<AuthResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      ),
    };
  }

  return { supabase, user };
}

/**
 * Resolves the signed-in user's organization membership, or a `NextResponse`
 * (401 signed-out, 403 no membership) to return as-is.
 */
export async function requireMembershipOrResponse(): Promise<MembershipResponse> {
  const result = await requireUserOrResponse();
  if ("response" in result) return result;

  const membership = await getUserMembership(result.user.id);
  if (!membership) {
    return {
      response: NextResponse.json(
        { error: "You do not belong to an organization." },
        { status: 403 },
      ),
    };
  }

  return { ...result, membership };
}
