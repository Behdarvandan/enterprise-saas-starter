"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUserResult } from "@/lib/auth";
import { ACTIVE_ORG_COOKIE } from "@/lib/team";
import { postgresUuid } from "@/lib/validation";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const switchSchema = z.object({ organizationId: postgresUuid() });

/**
 * Makes `organizationId` the caller's active organization. The cookie is only
 * written after confirming (under RLS) that the caller is a member of it, and
 * `getUserMembership` re-validates it on every read.
 */
export async function switchOrganization(
  organizationId: string,
): Promise<{ error?: string; success?: boolean }> {
  const t = await getTranslations("errors");

  const parsed = switchSchema.safeParse({ organizationId });
  if (!parsed.success) return { error: t("validation") };

  const auth = await requireUserResult();
  if ("error" in auth) return { error: auth.error };

  const { data: membership } = await auth.supabase
    .from("memberships")
    .select("organization_id")
    .eq("user_id", auth.user.id)
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle();

  if (!membership) return { error: t("forbidden") };

  (await cookies()).set(ACTIVE_ORG_COOKIE, membership.organization_id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });

  revalidatePath("/", "layout");
  return { success: true };
}
