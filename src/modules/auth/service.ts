import { createCoreBrowserClient } from "@/core/db/browser-client";

export type OAuthProvider = "google" | "github" | "apple";

export async function signInWithProvider(provider: OAuthProvider): Promise<{ error?: string }> {
  const supabase = createCoreBrowserClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}
