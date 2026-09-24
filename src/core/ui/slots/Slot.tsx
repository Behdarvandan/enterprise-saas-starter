import type { ReactNode } from "react";
import type { FeatureFlagMap } from "@/core/registry";
import { getContributions, type SlotId } from "@/core/ui/slots/SlotRegistry";

interface SlotProps {
  /** The slot id feature modules register contributions against. */
  id: SlotId;
  /** Rendered when nothing is registered for this slot. */
  fallback?: ReactNode;
  /** Runtime feature flags used to filter out contributions from disabled modules. */
  activeFlags?: FeatureFlagMap;
}

/** Renders every contribution currently registered for `id` via `SlotRegistry`. */
export default function Slot({ id, fallback = null, activeFlags }: SlotProps) {
  const components = getContributions(id, activeFlags);
  if (components.length === 0) return <>{fallback}</>;

  return (
    <>
      {components.map((Component, index) => (
        <Component key={index} />
      ))}
    </>
  );
}
