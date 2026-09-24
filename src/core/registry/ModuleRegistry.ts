import type { TenantRole } from "@/core/auth/types";
import type { ModuleManifest, ModuleNavigationItem } from "@/core/registry/types";

/**
 * In-memory module registry: feature modules register their manifest at
 * load time; the shell queries it for enabled modules and role-filtered
 * navigation. No feature modules exist yet (`src/modules/` is empty) — this
 * only defines the store.
 */
export class ModuleRegistry {
  private modules = new Map<string, ModuleManifest>();

  register(manifest: ModuleManifest): void {
    this.modules.set(manifest.id, manifest);
  }

  getModule(id: string): ModuleManifest | undefined {
    return this.modules.get(id);
  }

  getAllModules(): ModuleManifest[] {
    return Array.from(this.modules.values());
  }

  getEnabledModules(): ModuleManifest[] {
    return this.getAllModules().filter((module) => module.enabled);
  }

  /**
   * Role-filtered navigation across enabled modules. An item with no `roles`
   * is visible to everyone; an item with `roles` requires a matching
   * `userRole` — omitting `userRole` excludes every role-gated item.
   */
  getNavigationItems(userRole?: TenantRole): ModuleNavigationItem[] {
    return this.getEnabledModules()
      .flatMap((module) => module.navigation ?? [])
      .filter((item) => !item.roles || (userRole !== undefined && item.roles.includes(userRole)));
  }
}

export const moduleRegistry = new ModuleRegistry();
