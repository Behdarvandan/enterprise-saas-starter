"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LegacyButton from "@/components/ui/LegacyButton";

export default function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <LegacyButton variant="secondary" onClick={handleSignOut} className={className}>
      <LogOut size={16} />
      Sign out
    </LegacyButton>
  );
}
