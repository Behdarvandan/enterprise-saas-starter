"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireMembershipResult } from "@/lib/auth";
import { canManageMembers } from "@/lib/team";
import { firstIssueMessage, formField } from "@/lib/validation";

const updateOrganizationSchema = z.object({
  name: formField(
    z
      .string()
      .trim()
      .min(1, "name_required")
      .max(100, "name_too_long"),
  ),
});

export async function updateOrganization(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const t = await getTranslations("dashboard.settings");
  const auth = await requireMembershipResult();
  if ("error" in auth) return auth;
  const { supabase, membership } = auth;

  if (!canManageMembers(membership.role)) {
    return { error: t("errors.forbidden") };
  }

  const parsed = updateOrganizationSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return {
      error:
        firstIssueMessage(parsed.error) === "name_required"
          ? t("organization.nameRequired")
          : t("organization.nameTooLong"),
    };
  }
  const { name } = parsed.data;

  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", membership.organizationId);

  if (error) return { error: t("errors.generic") };

  revalidatePath("/dashboard/settings/organization");
  revalidatePath("/dashboard");
  return { success: true };
}
