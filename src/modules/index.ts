import { moduleRegistry } from "@/core/registry";
import { register as registerSlotContribution } from "@/core/ui/slots/SlotRegistry";
import { AgentApprovalModuleManifest, registerAgentApprovalListeners } from "@/modules/agent-approval"; // new
import { AuditLogsModuleManifest, registerAuditLogListeners } from "@/modules/audit-logs"; // new
import { BillingModuleManifest, registerBillingListeners } from "@/modules/billing"; // new
import { demoManifest } from "@/modules/demo";

// new: every registered module's manifest, replacing the demo-only single registration
const MODULE_MANIFESTS = [demoManifest, AuditLogsModuleManifest, AgentApprovalModuleManifest, BillingModuleManifest];

/**
 * Registers every feature module's manifest, and bridges each of its
 * declared slot contributions into SlotRegistry so Slot can render them.
 */
export function registerModules(): void {
  for (const manifest of MODULE_MANIFESTS) {
    moduleRegistry.register(manifest);

    for (const contribution of manifest.slots ?? []) {
      registerSlotContribution(contribution.slotId, contribution.component, manifest.id);
    }
  }

  // new: activate each module's EventBus listeners at bootstrap time
  registerAuditLogListeners();
  registerAgentApprovalListeners();
  registerBillingListeners();
}
