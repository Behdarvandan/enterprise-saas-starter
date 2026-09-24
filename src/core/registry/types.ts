import type { ComponentType } from "react";
import type { TenantRole } from "@/core/auth/types";

export interface ModuleNavigationItem {
  title: string;
  href: string;
  icon?: string;
  roles?: TenantRole[];
}

export interface ModuleSlotContribution {
  slotId: string;
  component: ComponentType;
}

export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  /** Default/feature-flag-resolved enabled state. */
  enabled: boolean;
  /** Feature-flag key (e.g. "module.demo") that can override `enabled` at runtime — see `ModuleRegistry.isModuleEnabled`. */
  featureFlagKey?: string;
  navigation?: ModuleNavigationItem[];
  slots?: ModuleSlotContribution[];
}

/** Runtime feature-flag values, keyed the same way as `ModuleManifest.featureFlagKey` (e.g. `{ "module.demo": true }`). */
export type FeatureFlagMap = Record<string, boolean>;
