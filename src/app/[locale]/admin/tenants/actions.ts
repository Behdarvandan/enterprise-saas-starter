"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireOperatorAdminResult } from "@/lib/operator";
import { createAdminClient } from "@/lib/supabase/admin";
import { postgresUuid } from "@/lib/validation";

const extendTrialSchema = z.object({
  organizationId: postgresUuid(),
  days: z.number().int().positive().max(365),
});

/**
 * Extends a tenant's trial by `days`, from whichever is later: its current
 * `trial_ends_at` (if still in the future) or now. Also (re)sets
 * `subscription_status` to `'trialing'`, since that's this action's whole
 * purpose. Uses the service-role client — the same admin-client bypass
 * pattern already used elsewhere (e.g. the Lemon Squeezy webhook handler) —
 * since this reaches across every tenant organization, not just the
 * caller's own.
 */
export async function extendTrialAction(
  organizationId: string,
  days: number,
): Promise<{ error?: string; success?: boolean; newTrialEndsAt?: string }> {
  const t = await getTranslations("admin.tenants");
  const auth = await requireOperatorAdminResult();
  if ("error" in auth) return auth;

  const parsed = extendTrialSchema.safeParse({ organizationId, days });
  if (!parsed.success) {
    return { error: t("extendTrialError") };
  }

  const admin = createAdminClient();

  const { data: organization, error: fetchError } = await admin
    .from("organizations")
    .select("trial_ends_at")
    .eq("id", parsed.data.organizationId)
    .single();

  if (fetchError || !organization) {
    return { error: t("extendTrialError") };
  }

  const now = Date.now();
  const currentTrialEnd = organization.trial_ends_at ? new Date(organization.trial_ends_at).getTime() : 0;
  const base = currentTrialEnd > now ? currentTrialEnd : now;
  const newTrialEndsAt = new Date(base + parsed.data.days * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await admin
    .from("organizations")
    .update({ trial_ends_at: newTrialEndsAt, subscription_status: "trialing" })
    .eq("id", parsed.data.organizationId);

  if (updateError) {
    return { error: t("extendTrialError") };
  }

  revalidatePath("/admin/tenants");
  return { success: true, newTrialEndsAt };
}
