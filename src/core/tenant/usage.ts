import { eventBus } from "@/core/events";

export function recordTenantUsage(tenantId: string, metric: string, quantity = 1, actorId?: string): void {
  eventBus.emit("usage:recorded", { tenantId, metric, quantity, actorId, timestamp: Date.now() });
}
