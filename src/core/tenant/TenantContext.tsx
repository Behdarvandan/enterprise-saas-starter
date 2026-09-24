"use client";

import { createContext, useState, type ReactNode } from "react";
import type { TenantRole } from "@/core/auth/types";

/** Minimal core tenant shape — feature-specific data (branding, etc.) stays out of core. */
export interface TenantContext {
  id: string;
  slug: string;
  name: string;
}

export interface TenantContextState {
  tenant: TenantContext | null;
  userRole: TenantRole | null;
  isLoading: boolean;
}

// Exported under a distinct name from the `TenantContext` type above so
// `useTenant.ts` can consume it without shadowing.
export const TenantReactContext = createContext<TenantContextState | undefined>(undefined);

interface TenantProviderProps {
  initialTenant: TenantContext | null;
  initialUserRole: TenantRole | null;
  children: ReactNode;
}

/**
 * Hydrates the tenant/role resolved server-side (e.g. a layout) into client
 * state via `useState`'s initializer — not `useEffect` — so the first client
 * render matches the server-rendered markup exactly and avoids a hydration
 * mismatch.
 */
export function TenantProvider({ initialTenant, initialUserRole, children }: TenantProviderProps) {
  const [tenant] = useState(initialTenant);
  const [userRole] = useState(initialUserRole);

  return (
    <TenantReactContext.Provider value={{ tenant, userRole, isLoading: false }}>
      {children}
    </TenantReactContext.Provider>
  );
}
