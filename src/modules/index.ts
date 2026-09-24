import { moduleRegistry } from "@/core/registry";
import { demoManifest } from "@/modules/demo";

/**
 * Registers every feature module's manifest. Not yet called anywhere — a
 * future bootstrap step invokes this once, early (e.g. root layout or
 * instrumentation).
 */
export function registerModules(): void {
  moduleRegistry.register(demoManifest);
}
