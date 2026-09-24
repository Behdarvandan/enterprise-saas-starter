import type { EventCallback, SystemEvents } from "@/core/events/types";

/** Type-erased storage form of a listener; narrowed back per-event at the `on`/`emit` call sites. */
type AnyEventCallback = EventCallback<SystemEvents[keyof SystemEvents]>;

/**
 * In-process typed pub/sub for cross-module communication without direct
 * module-to-module imports (Core Isolation Rule). Listeners run isolated via
 * `Promise.allSettled` — one throwing/rejecting listener never blocks or
 * breaks delivery to the others.
 */
export class EventBus {
  private listeners = new Map<keyof SystemEvents, Set<AnyEventCallback>>();

  on<K extends keyof SystemEvents>(event: K, callback: EventCallback<SystemEvents[K]>): () => void {
    const erasedCallback = callback as AnyEventCallback;
    const existing = this.listeners.get(event) ?? new Set<AnyEventCallback>();
    existing.add(erasedCallback);
    this.listeners.set(event, existing);

    return () => {
      existing.delete(erasedCallback);
    };
  }

  async emit<K extends keyof SystemEvents>(event: K, payload: SystemEvents[K]): Promise<void> {
    const callbacks = Array.from(this.listeners.get(event) ?? []);
    const results = await Promise.allSettled(callbacks.map((callback) => callback(payload)));

    for (const result of results) {
      if (result.status === "rejected") {
        console.error(`[core/events] listener for "${String(event)}" failed:`, result.reason);
      }
    }
  }
}

export const eventBus = new EventBus();
