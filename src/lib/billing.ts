import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Organization } from "@/types";

/**
 * Returns the first organization the given user belongs to, or null.
 */
export async function getUserOrganization(
  userId: string,
): Promise<Organization | null> {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", membership.organization_id)
    .single();

  return organization ?? null;
}

/**
 * Returns the user's organization, creating a default one (and making the user
 * its owner) when none exists yet.
 */
export async function ensureOrganization(user: {
  id: string;
  email?: string | null;
}): Promise<Organization | null> {
  const existing = await getUserOrganization(user.id);
  if (existing) return existing;

  const supabase = await createClient();

  const localPart = user.email?.split("@")[0] ?? "user";
  const name = `${localPart}'s Workspace`;
  const slug = `${localPart}-${user.id.slice(0, 8)}`.toLowerCase();

  const { data, error } = await supabase.rpc("create_organization", {
    org_name: name,
    org_slug: slug,
  });

  if (error) {
    console.error("Failed to create default organization:", error);
    return null;
  }

  return data;
}

/**
 * Returns whether the organization's subscription allows the public,
 * unauthenticated services (chat RAG and booking checkout) to run. Only
 * `active` and `trialing` subscriptions are considered serviceable.
 */
export async function isOrganizationServiceable(
  organizationId: string,
): Promise<boolean> {
  const admin = createAdminClient();

  const { data: organization } = await admin
    .from("organizations")
    .select("subscription_status")
    .eq("id", organizationId)
    .maybeSingle();

  return (
    organization?.subscription_status === "active" ||
    organization?.subscription_status === "trialing"
  );
}
