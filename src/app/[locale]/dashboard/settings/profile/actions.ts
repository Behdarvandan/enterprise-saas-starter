"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserResult } from "@/lib/auth";
import { firstIssueMessage, formField } from "@/lib/validation";

const updateProfileSchema = z.object({
  fullName: formField(z.string().trim().max(100, "Full name is too long.")),
});

export async function updateProfile(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireUserResult();
  if ("error" in auth) return auth;
  const { supabase, user } = auth;

  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("full_name"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const { fullName } = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName || null })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/profile");
  return { success: true };
}
