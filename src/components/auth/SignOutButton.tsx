"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/core/ui/primitives/button";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton({ className }: { className?: string }) {
  const t = useTranslations("ui");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    const { error } = await createClient().auth.signOut();
    if (error) {
      // Stay on the page: pretending to sign out would leave a live session.
      console.error("[auth] sign out failed:", error);
      setPending(false);
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="secondary" onClick={handleSignOut} loading={pending} className={className}>
      {pending ? null : <LogOut aria-hidden />}
      {pending ? t("signingOut") : t("signOut")}
    </Button>
  );
}
