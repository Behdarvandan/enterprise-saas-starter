import { useSyncExternalStore } from "react";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

const MAX_VISIBLE = 4;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** Queues a toast. Returns its id so callers can dismiss it early. */
export function toast(input: Omit<ToastItem, "id">): number {
  const id = nextId++;
  items = [...items, { ...input, id }].slice(-MAX_VISIBLE);
  emit();
  return id;
}

export function dismissToast(id: number): void {
  items = items.filter((item) => item.id !== id);
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY: ToastItem[] = [];

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(
    subscribe,
    () => items,
    () => EMPTY,
  );
}
