import type { ModuleManifest } from "@/core/registry";
import AuditLogTable from "@/modules/audit-logs/components/AuditLogTable";

/**
 * Contributes to "settings-tab-slot" — not yet defined in core's SHELL_SLOTS
 * (only DASHBOARD_OVERVIEW/HEADER_ACTIONS exist today) nor rendered by any
 * <Slot> in the app. Registers now so the slot lights up automatically once
 * both land in a later step, without this manifest needing to change.
 */
export const AuditLogsModuleManifest: ModuleManifest = {
  id: "audit-logs",
  name: "Audit Logs",
  version: "1.0.0",
  enabled: true,
  slots: [{ slotId: "settings-tab-slot", component: AuditLogTable }],
};
