import { createClient } from "@/lib/supabase/server";
import { createAnonClient } from "@/lib/supabase/anon";
import { getUserMembership } from "@/lib/team";
import type { Organization } from "@/types";

/**
 * Returns the first organization the given user belongs to, or null.
 */
export async function getUserOrganization(
  userId: string,
): Promise<Organization | null> {
  const membership = await getUserMembership(userId);
  if (!membership) return null;

  const supabase = await createClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", membership.organizationId)
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
 * `active` and `trialing` subscriptions are considered serviceable. Runs on
 * the anon-key client via the `is_organization_serviceable` RPC, since this
 * is called from anonymous request paths.
 */
export async function isOrganizationServiceable(
  organizationId: string,
): Promise<boolean> {
  const anon = createAnonClient();

  const { data } = await anon.rpc("is_organization_serviceable", {
    p_organization_id: organizationId,
  });

  return data === true;
}
