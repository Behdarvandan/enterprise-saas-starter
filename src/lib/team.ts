import { createClient } from "@/lib/supabase/server";
import type { MembershipRole } from "@/types";

export interface UserMembership {
  organizationId: string;
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
 * Whether a role is allowed to manage team members and invitations.
 */
export function canManageMembers(role: MembershipRole): boolean {
  return role === "owner" || role === "admin";
}
