import { KeyRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireMembership } from "@/lib/auth";
import { canRotateApiKey } from "@/lib/team";
import { Card } from "@/components/ui/card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";
import ProfileForm from "@/app/[locale]/dashboard/settings/profile/ProfileForm";
import RotateApiKeyButton from "./RotateApiKeyButton";

export const dynamic = "force-dynamic";

const SUBSCRIPTION_STATUS_TONE = {
  active: "success",
  suspended: "warn",
  cancelled: "error",
} as const;

/**
 * Ayarlar (brief §6): contact info, language, and notification preferences
 * — password/security stays in Supabase auth, not duplicated here. License
 * management (an existing feature with no slot in the brief's locked 4-item
 * nav) is folded in as its own tab rather than dropped.
 */
export default async function ClientSettingsPage() {
  const { supabase, user, membership } = await requireMembership();
  const t = await getTranslations("client.nav");

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

  const email = profile?.email ?? user.email ?? "";
  const fullName = profile?.full_name ?? "";
  const canRotate = subscription ? canRotateApiKey(membership.role) : false;
  const maskedKey = subscription
    ? `${subscription.license_key.slice(0, 6)}••••••••${subscription.license_key.slice(-4)}`
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-semibold text-ink-primary">{t("settings")}</h1>
      <p className="mt-1 text-sm text-ink-muted">
        İletişim bilgileri, dil tercihi ve lisans yönetimi.
      </p>

      <Tabs defaultValue="contact" className="animate-reveal-up mt-8">
        <TabsList>
          <TabsTrigger value="contact">İletişim</TabsTrigger>
          <TabsTrigger value="language">Dil</TabsTrigger>
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
          <TabsTrigger value="license">Lisans</TabsTrigger>
        </TabsList>

        <TabsContent value="contact">
          <div className="mt-4">
            <Card className="p-6">
              <ProfileForm email={email} fullName={fullName} />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="language">
          <div className="mt-4 flex items-center justify-between rounded-interactive border border-subtle bg-surface p-6">
            <div>
              <p className="text-sm font-medium text-ink-primary">Arayüz dili</p>
              <p className="mt-1 text-sm text-ink-muted">
                Panelin görüntülendiği dili değiştirin.
              </p>
            </div>
            <LocaleSwitcher />
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="mt-4 rounded-interactive border border-dashed border-subtle bg-surface p-6 text-center">
            <p className="text-sm font-medium text-ink-primary">Yakında</p>
            <p className="mt-1 text-sm text-ink-muted">
              Bildirim tercihleri henüz yapılandırılabilir değil.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="license">
          <div className="mt-4">
            {!subscription ? (
              <div className="rounded-interactive border border-subtle bg-surface">
                <EmptyState
                  icon={KeyRound}
                  title="No SaaS license"
                  description="This organization doesn't have an active SaaS license yet."
                />
              </div>
            ) : (
              <div className="rounded-interactive border border-subtle bg-surface p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Tier
                    </p>
                    <p className="mt-1 text-lg font-semibold capitalize text-ink-primary">
                      {subscription.tier}
                    </p>
                  </div>
                  <Badge
                    tone={
                      SUBSCRIPTION_STATUS_TONE[
                        subscription.status as keyof typeof SUBSCRIPTION_STATUS_TONE
                      ]
                    }
                  >
                    {subscription.status}
                  </Badge>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Seats
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink-primary">
                      {subscription.seats}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      License key
                    </p>
                    <p className="mt-1 font-mono text-sm text-ink-primary">{maskedKey}</p>
                  </div>
                </div>

                {canRotate && (
                  <div className="mt-6 border-t border-subtle pt-4">
                    <RotateApiKeyButton />
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
