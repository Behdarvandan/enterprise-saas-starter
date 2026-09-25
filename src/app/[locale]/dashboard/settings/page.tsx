import { Building2, ChevronRight, User } from "lucide-react";
import { getTranslations } from "next-intl/server";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { LiquidCard } from "@/components/ui/liquid/LiquidCard";
import { SHELL_SLOTS, Slot } from "@/core/ui/slots";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  await requireUser();
  const t = await getTranslations("dashboard.settings");

  const settings = [
    {
      label: t("profile.label"),
      description: t("profile.description"),
      href: "/dashboard/settings/profile",
      icon: User,
    },
    {
      label: t("organization.label"),
      description: t("organization.description"),
      href: "/dashboard/settings/organization",
      icon: Building2,
    },
  ];

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {settings.map((setting) => (
          <Link key={setting.href} href={setting.href} className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring/60">
            <LiquidCard variant="item" className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <setting.icon aria-hidden size={20} />
                </div>
                <ChevronRight aria-hidden size={18} className="text-muted-foreground rtl:rotate-180" />
              </div>
              <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground">{setting.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{setting.description}</p>
            </LiquidCard>
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <Slot id={SHELL_SLOTS.SETTINGS_TAB} />
      </div>
    </PageContainer>
  );
}
