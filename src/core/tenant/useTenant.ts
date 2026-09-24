"use client";

import { useContext } from "react";
import { TenantReactContext } from "@/core/tenant/TenantContext";

export function useTenant() {
  const context = useContext(TenantReactContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
