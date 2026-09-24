import { Fragment, type ReactNode } from "react";
import { getContributions, type SlotId } from "@/core/ui/slots/SlotRegistry";

interface SlotProps {
  /** The slot id feature modules register contributions against. */
  id: SlotId;
  /** Rendered when nothing is registered for this slot. */
  fallback?: ReactNode;
}

/** Renders every contribution currently registered for `id` via `SlotRegistry`. */
export default function Slot({ id, fallback = null }: SlotProps) {
  const items = getContributions<ReactNode>(id);
  if (items.length === 0) return <>{fallback}</>;

  return (
    <>
      {items.map((item, index) => (
        <Fragment key={index}>{item}</Fragment>
      ))}
    </>
  );
}
