/**
 * Reports loudly, with an explanatory error log, when a required production
 * environment variable is missing — instead of a much later, harder-to-trace
 * failure the first time a Supabase/Stripe call happens to hit an empty
 * placeholder (see src/lib/supabase/admin.ts and anon.ts, which both
 * silently fall back to "https://placeholder.supabase.co"-style defaults so
 * local dev never crashes on a missing .env.local entry).
 *
 * Only checked in production (`NODE_ENV === "production"`); local/dev/test
 * runs keep working with partial env. It does not throw: the app keeps
 * serving in a degraded, signed-out mode (see lib/supabase/env.ts).
 */

// Vars this app cannot function without in production: Supabase (every
// request touches it) and the Stripe secret/webhook signing pair (billing
// is core, and an unset STRIPE_WEBHOOK_SECRET means every webhook delivery
// is silently rejected as an invalid signature — see
// src/lib/payment/webhook-error.ts's "configuration" error kind).
const REQUIRED_PRODUCTION_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;

export function validateProductionConfig(): string[] {
  if (process.env.NODE_ENV !== "production") return [];

  const missing = REQUIRED_PRODUCTION_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length === 0) return [];

  // Logged, never thrown: an exception from `register()` in instrumentation.ts
  // fails every request with a 500, taking the marketing pages down for a
  // variable that only some features (billing, admin) actually need.
  console.error(
    `[config] Missing required production environment variable(s): ${missing.join(", ")}. ` +
      "Set them in your deployment platform's environment settings " +
      "(see .env.example for what each one is for). Continuing in degraded mode.",
  );
  return missing;
}
