/**
 * Minimal in-memory, typed slot registry: feature modules register UI
 * contributions against a named slot id; `Slot` (see ./Slot.tsx) renders
 * whatever is currently registered for a given id, filtered by whether the
 * contributing module (if any) is currently enabled.
 *
 * In-memory and module-scoped: registration must happen at module load time
 * (e.g. a feature module's root import), before the shell renders.
 */

import type { ComponentType } from "react";
import { moduleRegistry, type FeatureFlagMap } from "@/core/registry";

export type SlotId = string;

interface SlotContribution {
  component: ComponentType;
  /** The module that registered this contribution, if any — used to hide it when that module is disabled. */
  moduleId?: string;
}

const contributions = new Map<SlotId, SlotContribution[]>();

/** Registers `component` under `slotId`, optionally tagged with the registering module's id. Registration order is preserved. */
export function register(slotId: SlotId, component: ComponentType, moduleId?: string): void {
  const existing = contributions.get(slotId) ?? [];
  existing.push({ component, moduleId });
  contributions.set(slotId, existing);
}

/**
 * Components currently registered for `slotId`, in registration order, with
 * any contribution from a currently-disabled module filtered out. A
 * contribution with no `moduleId` is always included.
 */
export function getContributions(slotId: SlotId, activeFlags?: FeatureFlagMap): ComponentType[] {
  const entries = contributions.get(slotId) ?? [];
  return entries
    .filter((entry) => !entry.moduleId || moduleRegistry.isModuleEnabled(entry.moduleId, activeFlags))
    .map((entry) => entry.component);
}

/** Removes every registration for `slotId`. For tests. */
export function clearSlot(slotId: SlotId): void {
  contributions.delete(slotId);
}
