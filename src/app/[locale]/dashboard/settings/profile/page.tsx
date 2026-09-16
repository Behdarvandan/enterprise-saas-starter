import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LegacyCard from "@/components/ui/LegacyCard";
import ProfileForm from "./ProfileForm";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const email = profile?.email ?? user.email ?? "";
  const fullName = profile?.full_name ?? "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-ink-primary">Profile</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Update your personal information.
      </p>

      <div className="mt-6">
        <LegacyCard className="p-6">
          <ProfileForm email={email} fullName={fullName} />
        </LegacyCard>
      </div>
    </div>
  );
}
