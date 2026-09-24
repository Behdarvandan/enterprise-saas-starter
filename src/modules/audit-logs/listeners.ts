import { eventBus, type SystemEvents } from "@/core/events";

/**
 * Subscribes to "audit:logged". Persistence lands in a later step (no @/lib
 * DB access is available to modules yet); the inner try/catch keeps a bad
 * write from throwing synchronously ahead of eventBus's own
 * Promise.allSettled isolation.
 */
export function registerAuditLogListeners(): void {
  eventBus.on("audit:logged", async (payload: SystemEvents["audit:logged"]) => {
    try {
      console.log("[audit-logs] event received:", payload);
    } catch (error) {
      console.error("[audit-logs] failed to process audit:logged event:", error);
    }
  });
}
