import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types";

/**
 * Records an action in `audit_logs`. `write_audit_log` is service-role only,
 * hence the admin client. Best-effort: a logging failure never blocks the
 * change that already succeeded.
 */
export async function logAudit(params: {
  action: string;
  organizationId: string;
  actorId: string;
  targetTable: string;
  targetId?: string | null;
  metadata?: Record<string, Json>;
}): Promise<void> {
  try {
    const { error } = await createAdminClient().rpc("write_audit_log", {
      p_action: params.action,
      p_organization_id: params.organizationId,
      p_actor_id: params.actorId,
      p_target_table: params.targetTable,
      p_target_id: params.targetId ?? null,
      p_metadata: params.metadata ?? {},
    });
    if (error) throw error;
  } catch (error) {
    console.error(`Failed to write audit log for "${params.action}":`, error);
  }
}
