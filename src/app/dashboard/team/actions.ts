"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { canManageMembers, getUserMembership } from "@/lib/team";
import type { MembershipRole } from "@/types";

export type TeamActionResult = { error?: string; success?: boolean };

const ROLES: MembershipRole[] = ["owner", "admin", "member"];

export async function inviteMember(
  formData: FormData,
): Promise<TeamActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const membership = await getUserMembership(user.id);
  if (!membership) return { error: "You do not belong to an organization." };
  if (!canManageMembers(membership.role)) {
    return { error: "Only owners and admins can invite members." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member") as MembershipRole;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please provide a valid email address." };
  }
  if (!ROLES.includes(role)) {
    return { error: "Invalid role." };
  }

  // Prevent inviting someone who is already a member.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profile) {
    const { data: existing } = await supabase
      .from("memberships")
      .select("id")
      .eq("organization_id", membership.organizationId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (existing) return { error: "That person is already a member." };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase.from("invitations").insert({
    organization_id: membership.organizationId,
    email,
    role,
    token,
    expires_at: expiresAt,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "An invitation for this email already exists." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/team");
  return { success: true };
}

export async function revokeInvitation(
  invitationId: string,
): Promise<TeamActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const membership = await getUserMembership(user.id);
  if (!membership) return { error: "You do not belong to an organization." };
  if (!canManageMembers(membership.role)) {
    return { error: "Only owners and admins can revoke invitations." };
  }

  const { error } = await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("organization_id", membership.organizationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/team");
  return { success: true };
}

export async function removeMember(
  membershipId: string,
): Promise<TeamActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const membership = await getUserMembership(user.id);
  if (!membership) return { error: "You do not belong to an organization." };
  if (!canManageMembers(membership.role)) {
    return { error: "Only owners and admins can remove members." };
  }

  const { data: target } = await supabase
    .from("memberships")
    .select("role")
    .eq("id", membershipId)
    .eq("organization_id", membership.organizationId)
    .maybeSingle();

  if (!target) return { error: "Member not found." };
  if (target.role === "owner") {
    return { error: "You cannot remove the organization owner." };
  }

  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("id", membershipId)
    .eq("organization_id", membership.organizationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/team");
  return { success: true };
}

export async function updateMemberRole(
  membershipId: string,
  role: MembershipRole,
): Promise<TeamActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const membership = await getUserMembership(user.id);
  if (!membership) return { error: "You do not belong to an organization." };
  if (!canManageMembers(membership.role)) {
    return { error: "Only owners and admins can change roles." };
  }
  if (role !== "admin" && role !== "member") {
    return { error: "Invalid role." };
  }

  const { data: target } = await supabase
    .from("memberships")
    .select("role")
    .eq("id", membershipId)
    .eq("organization_id", membership.organizationId)
    .maybeSingle();

  if (!target) return { error: "Member not found." };
  if (target.role === "owner") {
    return { error: "You cannot change the owner's role." };
  }

  const { error } = await supabase
    .from("memberships")
    .update({ role })
    .eq("id", membershipId)
    .eq("organization_id", membership.organizationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/team");
  return { success: true };
}
