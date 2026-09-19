import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { MembershipRole } from "@/types";

/** httpOnly cookie holding the organization the user last switched to. */
export const ACTIVE_ORG_COOKIE = "active_org_id";

export interface UserMembership {
  organizationId: string;
  role: MembershipRole;
}

export interface UserOrganization {
  organizationId: string;
  /** Null when the organization row has no readable name; the UI supplies the label. */
  organizationName: string | null;
  role: MembershipRole;
}

interface MembershipRow {
  organization_id: string;
  role: MembershipRole;
}

/**
 * Picks the membership matching the user's last-selected organization, or
 * the oldest membership when nothing (valid) is selected. The cookie is
 * user-controlled, so it only ever selects among rows the user already owns.
 */
export function pickActiveMembership(
  rows: readonly MembershipRow[],
  activeOrganizationId: string | undefined,
): UserMembership | null {
  const match =
    (activeOrganizationId
      ? rows.find((row) => row.organization_id === activeOrganizationId)
      : undefined) ?? rows[0];

  return match ? { organizationId: match.organization_id, role: match.role } : null;
}

async function readActiveOrganizationCookie(): Promise<string | undefined> {
  try {
    return (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  } catch (error) {
    // `cookies()` throws outside a request scope (scripts, static
    // generation); there is no selection to honour there, so fall back to
    // the oldest membership.
    console.warn("[team] active organization cookie unavailable:", error);
    return undefined;
  }
}

/**
 * Returns the user's active organization membership, or null. The active
 * organization is the one chosen via the tenant switcher, falling back to
 * the oldest membership.
 */
export async function getUserMembership(
  userId: string,
): Promise<UserMembership | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("memberships")
    .select("organization_id, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return pickActiveMembership(data ?? [], await readActiveOrganizationCookie());
}

/**
 * Returns every organization the user belongs to, for the tenant switcher.
 * The schema permits more than one membership per user even though the
 * current onboarding flow only ever creates one.
 */
export async function getUserOrganizations(
  userId: string,
): Promise<UserOrganization[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("memberships")
    .select("organization_id, role, organizations ( name )")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    organizationId: row.organization_id,
    organizationName: row.organizations?.name ?? null,
    role: row.role,
  }));
}

/**
 * Whether a role is allowed to manage team members and invitations.
 */
export function canManageMembers(role: MembershipRole): boolean {
  return role === "owner" || role === "admin";
}

/**
 * Whether a role is allowed to self-serve rotate their organization's SaaS
 * API key. Mirrors `canManageMembers` — same owner/admin threshold, kept as
 * a separate helper since the two permissions may diverge later.
 */
export function canRotateApiKey(role: MembershipRole): boolean {
  return role === "owner" || role === "admin";
}
