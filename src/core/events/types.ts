export interface BaseEventPayload {
  tenantId: string;
  timestamp: number;
  actorId?: string;
}

export type EventCallback<T> = (payload: T) => void | Promise<void>;

export interface SystemEvents {
  "tenant:updated": BaseEventPayload & { changes: Record<string, unknown> };
  "audit:logged": BaseEventPayload & { action: string; resource?: string };
  "usage:recorded": BaseEventPayload & { metric: string; quantity: number };
}
