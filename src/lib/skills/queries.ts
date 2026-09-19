import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types";

/**
 * The tenant's active `tenant_configs.config`, or null when none exists yet.
 *
 * `tenant_configs` carries system prompts and skill grants and has no
 * client-readable RLS policy (service-role only, see
 * supabase/migrations/20261119000000_tenant_configs_and_match_vectors_bridge.sql),
 * so it is read via the admin client. Callers must pass the organization id
 * from `requireMembership*`, never from request input.
 */
export async function getActiveTenantConfig(organizationId: string): Promise<Json | null> {
  const { data, error } = await createAdminClient()
    .from("tenant_configs")
    .select("config")
    .eq("tenant_id", organizationId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to read tenant config: ${error.message}`);
  return data?.config ?? null;
}
