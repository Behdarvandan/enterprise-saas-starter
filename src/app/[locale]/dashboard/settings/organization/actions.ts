"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMembershipResult } from "@/lib/auth";
import { canManageMembers } from "@/lib/team";
import { firstIssueMessage, formField } from "@/lib/validation";

const updateOrganizationSchema = z.object({
  name: formField(
    z
      .string()
      .trim()
      .min(1, "Organization name is required.")
      .max(100, "Organization name is too long."),
  ),
});

export async function updateOrganization(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireMembershipResult();
  if ("error" in auth) return auth;
  const { supabase, membership } = auth;

  if (!canManageMembers(membership.role)) {
    return { error: "Only owners and admins can edit organization settings." };
  }

  const parsed = updateOrganizationSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const { name } = parsed.data;

  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", membership.organizationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/organization");
  revalidatePath("/dashboard");
  return { success: true };
}
