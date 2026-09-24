export interface AuditLogEntry {
  id: string;
  tenantId: string;
  action: string;
  resource?: string;
  actorId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}
