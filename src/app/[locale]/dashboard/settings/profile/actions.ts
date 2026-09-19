"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUserResult } from "@/lib/auth";
import { formField } from "@/lib/validation";

const updateProfileSchema = z.object({
  fullName: formField(z.string().trim().max(100, "name_too_long")),
});

export async function updateProfile(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const t = await getTranslations("dashboard.settings");
  const auth = await requireUserResult();
  if ("error" in auth) return auth;
  const { supabase, user } = auth;

  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("full_name"),
  });
  if (!parsed.success) return { error: t("profile.tooLong") };
  const { fullName } = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName || null })
    .eq("id", user.id);

  if (error) return { error: t("errors.generic") };

  revalidatePath("/dashboard/settings/profile");
  return { success: true };
}
