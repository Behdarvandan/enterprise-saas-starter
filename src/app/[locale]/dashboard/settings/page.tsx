import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { requireUser } from "@/lib/auth";
import NotificationPreferencesCard from "./NotificationPreferencesCard";
import ProfileForm from "./profile/ProfileForm";
import SecurityCard from "./SecurityCard";

export default async function DashboardSettingsPage() {
  const { supabase, user } = await requireUser();
  const t = await getTranslations("dashboard.settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>

      <Card variant="section">
        <CardHeader>
          <CardTitle>{t("profile.label")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm email={profile?.email ?? user.email ?? ""} fullName={profile?.full_name ?? ""} />
        </CardContent>
      </Card>

      <SecurityCard
        copy={{
          title: t("security.title"),
          currentPasswordLabel: t("security.currentPasswordLabel"),
          newPasswordLabel: t("security.newPasswordLabel"),
          confirmPasswordLabel: t("security.confirmPasswordLabel"),
          updateButton: t("security.updateButton"),
        }}
      />

      <NotificationPreferencesCard
        copy={{
          title: t("notifications.title"),
          emailLabel: t("notifications.emailLabel"),
          productUpdatesLabel: t("notifications.productUpdatesLabel"),
        }}
      />
    </div>
  );
}
