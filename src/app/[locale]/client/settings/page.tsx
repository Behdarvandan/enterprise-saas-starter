import { KeyRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import ProfileForm from "@/app/[locale]/dashboard/settings/profile/ProfileForm";
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Badge } from "@/core/ui/primitives/badge";
import { Card } from "@/core/ui/primitives/card";
import EmptyState from "@/components/ui/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/ui/primitives/tabs";
import { requireMembership } from "@/lib/auth";
import { canRotateApiKey } from "@/lib/team";
import RotateApiKeyButton from "./RotateApiKeyButton";

export const dynamic = "force-dynamic";

const LICENSE_STATUSES = ["active", "suspended", "cancelled"] as const;
type LicenseStatus = (typeof LICENSE_STATUSES)[number];

const STATUS_VARIANT: Record<LicenseStatus, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  suspended: "secondary",
  cancelled: "destructive",
};

function asLicenseStatus(value: string): LicenseStatus | null {
  return (LICENSE_STATUSES as readonly string[]).includes(value) ? (value as LicenseStatus) : null;
}

/**
 * Settings: contact info, language and notification preferences —
 * password/security stays in Supabase auth, not duplicated here. License
 * management (an existing feature with no slot in the locked 4-item nav) is
 * folded in as its own tab rather than dropped.
 */
export default async function ClientSettingsPage() {
  const { supabase, user, membership } = await requireMembership();
  const [t, tNav, tTiers] = await Promise.all([
    getTranslations("client.settings"),
    getTranslations("client.nav"),
    getTranslations("common.tiers"),
  ]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: subscription } = await supabase
    .from("saas_subscriptions")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .maybeSingle();

  const canRotate = subscription ? canRotateApiKey(membership.role) : false;
  const maskedKey = subscription
    ? `${subscription.license_key.slice(0, 6)}••••••••${subscription.license_key.slice(-4)}`
    : null;
  const licenseStatus = subscription ? asLicenseStatus(subscription.status) : null;
  const tier = subscription?.tier;
  const knownTier = tier === "starter" || tier === "pro" || tier === "enterprise" ? tier : null;

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title={tNav("settings")} description={t("description")} />

      <Tabs defaultValue="contact">
        <TabsList>
          <TabsTrigger value="contact">{t("tabs.contact")}</TabsTrigger>
          <TabsTrigger value="language">{t("tabs.language")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("tabs.notifications")}</TabsTrigger>
          <TabsTrigger value="license">{t("tabs.license")}</TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="mt-4">
          <Card className="p-6">
            <ProfileForm email={profile?.email ?? user.email ?? ""} fullName={profile?.full_name ?? ""} />
          </Card>
        </TabsContent>

        <TabsContent value="language" className="mt-4">
          <Card className="flex items-center justify-between gap-4 p-6">
            <div>
              <p className="text-sm font-medium text-slate-100">{t("language.title")}</p>
              <p className="mt-1 text-sm text-slate-400">{t("language.description")}</p>
            </div>
            <LocaleSwitcher />
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card className="border-dashed p-6 text-center">
            <p className="text-sm font-medium text-slate-100">{t("notifications.title")}</p>
            <p className="mt-1 text-sm text-slate-400">{t("notifications.description")}</p>
          </Card>
        </TabsContent>

        <TabsContent value="license" className="mt-4">
          {!subscription ? (
            <Card>
              <EmptyState icon={KeyRound} title={t("license.emptyTitle")} description={t("license.emptyDescription")} />
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">{t("license.tier")}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">
                    {knownTier ? tTiers(knownTier) : subscription.tier}
                  </p>
                </div>
                <Badge variant={licenseStatus ? STATUS_VARIANT[licenseStatus] : "outline"}>
                  {licenseStatus ? t(`license.status.${licenseStatus}`) : subscription.status}
                </Badge>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-slate-400">{t("license.seats")}</p>
                  <p className="mt-1 font-mono text-sm font-medium text-slate-100">{subscription.seats}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">{t("license.key")}</p>
                  <p dir="ltr" className="mt-1 text-start font-mono text-sm text-slate-100">
                    {maskedKey}
                  </p>
                </div>
              </div>

              {canRotate ? (
                <div className="mt-6 border-t border-slate-800 pt-4">
                  <RotateApiKeyButton />
                </div>
              ) : null}
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
