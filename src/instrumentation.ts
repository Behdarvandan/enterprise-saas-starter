import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateProductionConfig } = await import("@/lib/config-check");
    validateProductionConfig();

    const { registerModules } = await import("@/modules");
    registerModules();

    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
