import { createClient } from "@supabase/supabase-js";
import type { GenericDatabase } from "@/core/db/types";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_SERVICE_ROLE_KEY = "placeholder-service-key";

let warned = false;

/**
 * Supabase URL / service-role key — duplicated from `@/lib/supabase/admin.ts`
 * rather than imported, so `src/core/db/` stays free of `@/lib/*` (Pure Core rule).
 */
function getCoreAdminEnv(): { url: string; serviceRoleKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (url && serviceRoleKey) return { url, serviceRoleKey };

  if (!warned) {
    warned = true;
    console.warn(
      "[core/db] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is missing; " +
        "admin client will not be able to reach Supabase until it is configured.",
    );
  }
  return { url: PLACEHOLDER_URL, serviceRoleKey: PLACEHOLDER_SERVICE_ROLE_KEY };
}

/**
 * Supabase client using the service-role key, which bypasses Row Level
 * Security. Server-only, privileged — for system-triggered writes such as
 * webhook handlers, never for user-initiated requests (those should use
 * `createCoreServerClient`, which stays scoped to the caller's own session).
 */
export function createCoreAdminClient<TDatabase = GenericDatabase>() {
  const { url, serviceRoleKey } = getCoreAdminEnv();
  return createClient<TDatabase>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
