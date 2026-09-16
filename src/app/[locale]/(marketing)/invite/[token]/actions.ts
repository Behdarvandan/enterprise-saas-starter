"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export async function acceptInvitation(
  token: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Server actions run outside a rendered route tree, so the locale must be
  // read explicitly instead of being inferred from route params.
  const locale = await getLocale();

  if (!user) {
    return redirect({ href: "/login", locale });
  }

  const { error } = await supabase.rpc("accept_invitation", { p_token: token });
  if (error) {
    return { error: error.message };
  }

  return redirect({ href: "/dashboard", locale });
}
