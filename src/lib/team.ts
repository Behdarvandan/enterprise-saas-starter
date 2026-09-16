import { createClient } from "@/lib/supabase/server";
import type { MembershipRole } from "@/types";

export interface UserMembership {
  organizationId: string;
  role: MembershipRole;
}

export interface UserOrganization {
  organizationId: string;
  organizationName: string;
  role: MembershipRole;
}

/**
 * Returns the first organization membership for the given user, or null.
 */
export async function getUserMembership(
  userId: string,
): Promise<UserMembership | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("memberships")
    .select("organization_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return { organizationId: data.organization_id, role: data.role };
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
    .eq("user_id", userId);

  return (data ?? []).map((row) => ({
    organizationId: row.organization_id,
    organizationName: row.organizations?.name ?? "Untitled organization",
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
