import { createCoreServerClient } from "@/core/db";
import type { AuditLogEntry } from "@/modules/audit-logs/types";

interface CreateAuditLogInput {
  tenantId: string;
  action: string;
  actorId?: string;
  resource?: string;
  details?: Record<string, unknown>;
}

interface AuditLogRow {
  id: string;
  organization_id: string;
  action: string;
  target_table: string | null;
  actor_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

function toAuditLogEntry(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    tenantId: row.organization_id,
    action: row.action,
    resource: row.target_table ?? undefined,
    actorId: row.actor_id ?? undefined,
    details: row.metadata,
    createdAt: row.created_at,
  };
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLogEntry> {
  const supabase = await createCoreServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      organization_id: input.tenantId,
      action: input.action,
      actor_id: input.actorId ?? null,
      target_table: input.resource ?? null,
      metadata: input.details ?? {},
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error("[audit-logs] failed to create audit log");
  }

  return toAuditLogEntry(data as unknown as AuditLogRow);
}

export async function getAuditLogs(tenantId: string): Promise<AuditLogEntry[]> {
  const supabase = await createCoreServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select()
    .eq("organization_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("[audit-logs] failed to fetch audit logs");
  }

  return ((data ?? []) as unknown as AuditLogRow[]).map(toAuditLogEntry);
}
