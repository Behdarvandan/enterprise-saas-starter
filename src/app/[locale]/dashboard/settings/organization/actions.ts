"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canManageMembers, getUserMembership } from "@/lib/team";

export async function updateOrganization(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const membership = await getUserMembership(user.id);
  if (!membership) return { error: "You do not belong to an organization." };
  if (!canManageMembers(membership.role)) {
    return { error: "Only owners and admins can edit organization settings." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Organization name is required." };
  if (name.length > 100) return { error: "Organization name is too long." };

  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", membership.organizationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/organization");
  revalidatePath("/dashboard");
  return { success: true };
}
