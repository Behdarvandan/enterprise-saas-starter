import { getTranslations } from "next-intl/server";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Card } from "@/core/ui/primitives/card";
import { requireUser } from "@/lib/auth";
import ProfileForm from "./ProfileForm";

export default async function ProfileSettingsPage() {
  const { supabase, user } = await requireUser();
  const t = await getTranslations("dashboard.settings.profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title={t("label")} description={t("pageDescription")} />
      <Card className="p-6">
        <ProfileForm email={profile?.email ?? user.email ?? ""} fullName={profile?.full_name ?? ""} />
      </Card>
    </PageContainer>
  );
}
