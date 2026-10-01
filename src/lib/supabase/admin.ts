import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_SERVICE_ROLE_KEY = "placeholder-service-key";

/**
 * Production *runtime* only: `next build` also runs with NODE_ENV=production
 * but legitimately has no secrets, so it must keep falling back to the
 * placeholders (see src/lib/config-check.ts for the logged-not-thrown policy
 * of the rest of the app).
 */
function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  );
}

/**
 * Supabase client using the service-role key, which bypasses Row Level
 * Security. Server-only — never import in Client Components. Use it only for
 * privileged operations such as the Stripe webhook handler.
 *
 * In production a missing URL/key throws instead of silently talking to a
 * placeholder host, so a misconfigured deployment fails loudly at the
 * privileged call site rather than producing confusing downstream errors.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if ((!supabaseUrl || !serviceRoleKey) && isProductionRuntime()) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use the admin client.",
    );
  }

  return createSupabaseClient<Database>(
    supabaseUrl || PLACEHOLDER_URL,
    serviceRoleKey || PLACEHOLDER_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
