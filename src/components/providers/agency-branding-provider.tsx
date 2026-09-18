"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AgencyBranding, AgencyContext } from "@/lib/agency/branding";

/**
 * Exposes the resolved agency's branding (logo / title) to Client
 * Components. `null` on the platform's own domains, so consumers fall back
 * to the default Pasargad look.
 *
 * The palette is deliberately NOT applied here: the root layout sets the CSS
 * variables on `<html>` during SSR (see `getBrandingCssVars`), so the first
 * paint already uses the agency's colors instead of flashing the default
 * palette until hydration.
 */
const AgencyBrandingContext = createContext<AgencyBranding | null>(null);

export function AgencyBrandingProvider({
  agency,
  children,
}: {
  agency: AgencyContext | null;
  children: ReactNode;
}) {
  return (
    <AgencyBrandingContext.Provider value={agency?.branding ?? null}>
      {children}
    </AgencyBrandingContext.Provider>
  );
}

export function useAgencyBranding(): AgencyBranding | null {
  return useContext(AgencyBrandingContext);
}
