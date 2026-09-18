/**
 * Fails fast, with an explanatory error, when a required production
 * environment variable is missing — instead of a much later, harder-to-trace
 * failure the first time a Supabase/Stripe call happens to hit an empty
 * placeholder (see src/lib/supabase/admin.ts and anon.ts, which both
 * silently fall back to "https://placeholder.supabase.co"-style defaults so
 * local dev never crashes on a missing .env.local entry).
 *
 * Only enforced in production (`NODE_ENV === "production"`): local/dev/test
 * runs keep working with partial env, matching every other module in this
 * codebase's "degrade locally, fail loudly in prod" convention.
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

export function validateProductionConfig(): void {
  if (process.env.NODE_ENV !== "production") return;

  const missing = REQUIRED_PRODUCTION_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length === 0) return;

  throw new Error(
    `Missing required production environment variable(s): ${missing.join(", ")}. ` +
      "Set them in your deployment platform's environment settings before starting the app " +
      "(see .env.example for what each one is for).",
  );
}
