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
  navigation?: ModuleNavigationItem[];
  slots?: ModuleSlotContribution[];
}
