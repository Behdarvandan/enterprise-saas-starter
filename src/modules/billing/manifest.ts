import type { ModuleManifest } from "@/core/registry";
import { SHELL_SLOTS } from "@/core/ui/slots";
import UsageTracker from "@/modules/billing/components/UsageTracker";

export const BillingModuleManifest: ModuleManifest = {
  id: "billing",
  name: "Billing",
  version: "1.0.0",
  enabled: true,
  slots: [{ slotId: SHELL_SLOTS.SETTINGS_TAB, component: UsageTracker }],
};
