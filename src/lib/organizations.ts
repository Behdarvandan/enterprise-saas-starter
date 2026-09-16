import { createClient } from "@/lib/supabase/server";

/**
 * Returns an organization's display name, or `null` if it doesn't exist.
 * Small enough that most callers should keep inlining the query when it's
 * one of several fields already being selected (or batched alongside other
 * independent queries in a `Promise.all`) — this is for the common
 * name-only lookup repeated across several dashboard pages and actions.
 */
export async function getOrganizationName(
  organizationId: string,
): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .maybeSingle();

  return data?.name ?? null;
}
