/**
 * Minimal in-memory, typed slot registry: feature modules register UI
 * contributions against a named slot id; `Slot` (see ./Slot.tsx) renders
 * whatever is currently registered for a given id. No feature modules exist
 * yet (`src/modules/` is still empty) — this only defines the mechanism.
 *
 * In-memory and module-scoped: registration must happen at module load time
 * (e.g. a feature module's root import), before the shell renders.
 */

export type SlotId = string;

const contributions = new Map<SlotId, unknown[]>();

/** Registers `contribution` under `slotId`. Registration order is preserved. */
export function register<T>(slotId: SlotId, contribution: T): void {
  const existing = contributions.get(slotId) ?? [];
  existing.push(contribution);
  contributions.set(slotId, existing);
}

/** All contributions currently registered for `slotId`, in registration order. */
export function getContributions<T>(slotId: SlotId): T[] {
  return (contributions.get(slotId) ?? []) as T[];
}

/** Removes every registration for `slotId`. For tests. */
export function clearSlot(slotId: SlotId): void {
  contributions.delete(slotId);
}
