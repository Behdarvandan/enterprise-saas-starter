"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { requireMembershipResult } from "@/lib/auth";
import { canManageMembers } from "@/lib/team";
import { sendInvitationEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/url";
import { getOrganizationName } from "@/lib/organizations";
import { createAdminClient } from "@/lib/supabase/admin";
import { firstIssueMessage, formField } from "@/lib/validation";
import type { Json, MembershipRole } from "@/types";

/**
 * `write_audit_log` is grant-restricted to `service_role` (see
 * supabase/migrations/20261114000005_audit_logs.sql), so every call site
 * below goes through the admin client rather than the caller's RLS-scoped
 * one. Best-effort: a logging failure never blocks the membership change
 * that already succeeded.
 */
async function logMembershipAudit(params: {
  action: string;
  organizationId: string;
  actorId: string;
  targetId?: string | null;
  metadata?: Record<string, Json>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.rpc("write_audit_log", {
      p_action: params.action,
      p_organization_id: params.organizationId,
      p_actor_id: params.actorId,
      p_target_table: "memberships",
      p_target_id: params.targetId ?? null,
      p_metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error(`Failed to write audit log for "${params.action}":`, error);
  }
}

export type TeamActionResult = { error?: string; success?: boolean };

const inviteMemberSchema = z.object({
  email: formField(z.string().trim().toLowerCase().email("invalid_email")),
  // Defaults to "member" when omitted, matching the form's implicit default;
  // any other non-empty value must be a real role or validation fails.
  role: z.preprocess(
    (value) => (typeof value === "string" && value ? value : "member"),
    z.enum(["owner", "admin", "member"], { message: "invalid_role" }),
  ),
});

export async function inviteMember(
  formData: FormData,
): Promise<TeamActionResult> {
  const t = await getTranslations("dashboard.team.errors");
  const auth = await requireMembershipResult();
  if ("error" in auth) return auth;
  const { supabase, membership } = auth;

  if (!canManageMembers(membership.role)) {
    return { error: t("cannotInvite") };
  }

  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) === "invalid_email" ? t("invalidEmail") : t("invalidRole") };
  }
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

    if (existing) return { error: t("alreadyMember") };
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
      return { error: t("alreadyInvited") };
    }
    return { error: t("generic") };
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

  await logMembershipAudit({
    action: "membership.invited",
    organizationId: membership.organizationId,
    actorId: auth.user.id,
    metadata: { email, role },
  });

  revalidatePath("/dashboard/team");
  return { success: true };
}

export async function revokeInvitation(
  invitationId: string,
): Promise<TeamActionResult> {
  const t = await getTranslations("dashboard.team.errors");
  const auth = await requireMembershipResult();
  if ("error" in auth) return auth;
  const { supabase, membership } = auth;

  if (!canManageMembers(membership.role)) {
    return { error: t("cannotRevoke") };
  }

  const { error } = await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("organization_id", membership.organizationId);

  if (error) return { error: t("generic") };

  revalidatePath("/dashboard/team");
  return { success: true };
}

export async function removeMember(
  membershipId: string,
): Promise<TeamActionResult> {
  const t = await getTranslations("dashboard.team.errors");
  const auth = await requireMembershipResult();
  if ("error" in auth) return auth;
  const { supabase, membership } = auth;

  if (!canManageMembers(membership.role)) {
    return { error: t("cannotRemove") };
  }

  const { data: target } = await supabase
    .from("memberships")
    .select("role")
    .eq("id", membershipId)
    .eq("organization_id", membership.organizationId)
    .maybeSingle();

  if (!target) return { error: t("memberNotFound") };
  if (target.role === "owner") {
    return { error: t("cannotRemoveOwner") };
  }

  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("id", membershipId)
    .eq("organization_id", membership.organizationId);

  if (error) return { error: t("generic") };

  await logMembershipAudit({
    action: "membership.removed",
    organizationId: membership.organizationId,
    actorId: auth.user.id,
    targetId: membershipId,
    metadata: { role: target.role },
  });

  revalidatePath("/dashboard/team");
  return { success: true };
}

export async function updateMemberRole(
  membershipId: string,
  role: MembershipRole,
): Promise<TeamActionResult> {
  const t = await getTranslations("dashboard.team.errors");
  const auth = await requireMembershipResult();
  if ("error" in auth) return auth;
  const { supabase, membership } = auth;

  if (!canManageMembers(membership.role)) {
    return { error: t("cannotChangeRoles") };
  }
  if (role !== "admin" && role !== "member") {
    return { error: t("invalidRole") };
  }

  const { data: target } = await supabase
    .from("memberships")
    .select("role")
    .eq("id", membershipId)
    .eq("organization_id", membership.organizationId)
    .maybeSingle();

  if (!target) return { error: t("memberNotFound") };
  if (target.role === "owner") {
    return { error: t("cannotChangeOwner") };
  }

  const { error } = await supabase
    .from("memberships")
    .update({ role })
    .eq("id", membershipId)
    .eq("organization_id", membership.organizationId);

  if (error) return { error: t("generic") };

  await logMembershipAudit({
    action: "membership.role_changed",
    organizationId: membership.organizationId,
    actorId: auth.user.id,
    targetId: membershipId,
    metadata: { from: target.role, to: role },
  });

  revalidatePath("/dashboard/team");
  return { success: true };
}
