"use server";

import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/url";

export async function requestPasswordReset(
  email: string,
): Promise<{ error?: string; success?: boolean }> {
  const normalized = email.trim().toLowerCase();

  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    const t = await getTranslations("auth.forgotPassword.errors");
    return { error: t("invalidEmail") };
  }

  const baseUrl = await getBaseUrl();
  const redirectTo = `${baseUrl}/reset-password`;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: normalized,
    options: { redirectTo },
  });

  const actionLink = data?.properties?.action_link;

  // Avoid leaking whether the email exists — return a generic success.
  if (error || !actionLink) {
    return { success: true };
  }

  try {
    await sendPasswordResetEmail({ to: normalized, resetUrl: actionLink });
  } catch (sendError) {
    console.error("Failed to send password reset email:", sendError);
  }

  return { success: true };
}
