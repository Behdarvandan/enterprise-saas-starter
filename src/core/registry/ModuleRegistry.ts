import type { TenantRole } from "@/core/auth/types";
import type { FeatureFlagMap, ModuleManifest, ModuleNavigationItem } from "@/core/registry/types";

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

  /**
   * Whether `id` is enabled right now: a flag present in `activeFlags`
   * (keyed by the manifest's `featureFlagKey`) overrides the manifest's
   * default `enabled`; a missing flag or missing `featureFlagKey` falls back
   * to `enabled`. An unknown module id is never enabled.
   */
  isModuleEnabled(id: string, activeFlags?: FeatureFlagMap): boolean {
    const manifest = this.modules.get(id);
    if (!manifest) return false;

    if (manifest.featureFlagKey && activeFlags && manifest.featureFlagKey in activeFlags) {
      return activeFlags[manifest.featureFlagKey];
    }

    return manifest.enabled;
  }

  getEnabledModules(activeFlags?: FeatureFlagMap): ModuleManifest[] {
    return this.getAllModules().filter((module) => this.isModuleEnabled(module.id, activeFlags));
  }

  /**
   * Role-filtered navigation across enabled modules. An item with no `roles`
   * is visible to everyone; an item with `roles` requires a matching
   * `userRole` — omitting `userRole` excludes every role-gated item.
   */
  getNavigationItems(userRole?: TenantRole, activeFlags?: FeatureFlagMap): ModuleNavigationItem[] {
    return this.getEnabledModules(activeFlags)
      .flatMap((module) => module.navigation ?? [])
      .filter((item) => !item.roles || (userRole !== undefined && item.roles.includes(userRole)));
  }
}

export const moduleRegistry = new ModuleRegistry();
