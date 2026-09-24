import { eventBus, type SystemEvents } from "@/core/events";

/**
 * Subscribes to "usage:recorded". No data store yet, so the handler just
 * logs receipt — matches the audit-logs listener's precedent of a
 * logging-only placeholder until persistence exists.
 */
export function registerBillingListeners(): void {
  eventBus.on("usage:recorded", async (payload: SystemEvents["usage:recorded"]) => {
    console.log("[billing] usage:recorded event received:", payload);
  });
}
