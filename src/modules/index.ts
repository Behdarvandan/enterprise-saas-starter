import { moduleRegistry } from "@/core/registry";
import { register as registerSlotContribution } from "@/core/ui/slots/SlotRegistry";
import { demoManifest } from "@/modules/demo";

/**
 * Registers every feature module's manifest, and bridges each of its
 * declared slot contributions into SlotRegistry so Slot can render them.
 */
export function registerModules(): void {
  moduleRegistry.register(demoManifest);

  for (const contribution of demoManifest.slots ?? []) {
    registerSlotContribution(contribution.slotId, contribution.component);
  }
}
