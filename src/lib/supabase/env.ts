const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_ANON_KEY = "placeholder-key";

let warned = false;

function isValidHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Supabase URL / anon key for the SSR and middleware clients.
 *
 * A missing or malformed value (e.g. a stray space in the deployment
 * settings) falls back to a placeholder instead of letting
 * `createServerClient` throw "Invalid supabaseUrl" on every request: the
 * page then renders as a signed-out visitor and the misconfiguration is
 * logged once per isolate.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (url && anonKey && isValidHttpUrl(url)) return { url, anonKey };

  if (!warned) {
    warned = true;
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid; " +
        "serving requests as signed-out until it is configured.",
    );
  }
  return { url: PLACEHOLDER_URL, anonKey: PLACEHOLDER_ANON_KEY };
}
