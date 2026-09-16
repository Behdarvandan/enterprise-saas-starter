import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

/**
 * Supabase client using the anon key — fully subject to Row Level Security.
 * For anonymous, unauthenticated flows (public booking, public RAG chat)
 * that need to reach tenant-scoped tables through vetted `SECURITY DEFINER`
 * RPCs. Never use `createAdminClient()` (service-role, bypasses RLS
 * unconditionally) for these: the whole point is that a bug in the calling
 * code can no longer produce a cross-tenant read/write on its own, since
 * this client has no table-level grants — only EXECUTE on specific
 * functions. There is no session/cookies to bind: these flows have no user.
 */
export function createAnonClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
