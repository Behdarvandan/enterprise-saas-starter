import type { ModuleManifest } from "@/core/registry";
import UsageTracker from "@/modules/billing/components/UsageTracker";

/**
 * Contributes to "settings-tab-slot" — same not-yet-defined SHELL_SLOTS
 * constant / not-yet-consumed slot as audit-logs (5.3); registers now so it
 * lights up automatically once a settings page renders that slot.
 */
export const BillingModuleManifest: ModuleManifest = {
  id: "billing",
  name: "Billing",
  version: "1.0.0",
  enabled: true,
  slots: [{ slotId: "settings-tab-slot", component: UsageTracker }],
};
