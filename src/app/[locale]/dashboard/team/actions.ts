"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { requireMembershipResult } from "@/lib/auth";
import { canManageMembers } from "@/lib/team";
import { sendInvitationEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/url";
import { getOrganizationName } from "@/lib/organizations";
import { firstIssueMessage, formField } from "@/lib/validation";
import type { MembershipRole } from "@/types";

export type TeamActionResult = { error?: string; success?: boolean };

const inviteMemberSchema = z.object({
  email: formField(
    z.string().trim().toLowerCase().email("Please provide a valid email address."),
  ),
  // Defaults to "member" when omitted, matching the form's implicit default;
  // any other non-empty value must be a real role or validation fails.
  role: z.preprocess(
    (value) => (typeof value === "string" && value ? value : "member"),
    z.enum(["owner", "admin", "member"], { message: "Invalid role." }),
  ),
});

export async function inviteMember(
  formData: FormData,
): Promise<TeamActionResult> {
  const auth = await requireMembershipResult();
  if ("error" in auth) return auth;
  const { supabase, membership } = auth;

  if (!canManageMembers(membership.role)) {
    return { error: "Only owners and admins can invite members." };
  }

  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const { email, role } = parsed.data;

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

  // Best-effort: send the invitation email (the invitation is already saved).
  try {
    const baseUrl = await getBaseUrl();
    const organizationName = await getOrganizationName(membership.organizationId);

    await sendInvitationEmail({
      to: email,
      organizationName: organizationName ?? "Your organization",
      role,
      inviteUrl: `${baseUrl}/invite/${token}`,
    });
  } catch (sendError) {
    console.error("Failed to send invitation email:", sendError);
  }

  revalidatePath("/dashboard/team");
  return { success: true };
}

export async function revokeInvitation(
  invitationId: string,
): Promise<TeamActionResult> {
  const auth = await requireMembershipResult();
  if ("error" in auth) return auth;
  const { supabase, membership } = auth;

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
  const auth = await requireMembershipResult();
  if ("error" in auth) return auth;
  const { supabase, membership } = auth;

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
  const auth = await requireMembershipResult();
  if ("error" in auth) return auth;
  const { supabase, membership } = auth;

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
