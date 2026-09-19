import { logAudit } from "@/lib/audit";
import type { Json } from "@/types";

/**
 * Records an agency-portal action in `audit_logs` (operator-facing), scoped to
 * the agency's master organization. Best-effort — see `logAudit`.
 */
export async function logAgencyAudit(params: {
  action: string;
  agencyMasterTenantId: string;
  actorId: string;
  targetTable: string;
  targetId?: string | null;
  metadata?: Record<string, Json>;
}): Promise<void> {
  await logAudit({
    action: params.action,
    organizationId: params.agencyMasterTenantId,
    actorId: params.actorId,
    targetTable: params.targetTable,
    targetId: params.targetId,
    metadata: params.metadata,
  });
}
