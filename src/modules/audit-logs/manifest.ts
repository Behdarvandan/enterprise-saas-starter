import type { ModuleManifest } from "@/core/registry";
import { SHELL_SLOTS } from "@/core/ui/slots";
import AuditLogTable from "@/modules/audit-logs/components/AuditLogTable";

export const AuditLogsModuleManifest: ModuleManifest = {
  id: "audit-logs",
  name: "Audit Logs",
  version: "1.0.0",
  enabled: true,
  slots: [{ slotId: SHELL_SLOTS.SETTINGS_TAB, component: AuditLogTable }],
};
