import { getFormatter, getTranslations } from "next-intl/server";
import BillingPortalButton from "@/components/billing/BillingPortalButton";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { resolvePlanTier } from "@/lib/plans";
import { asSubscriptionStatus } from "@/lib/status";
import { getUserMembership } from "@/lib/team";
import type { Organization } from "@/types";

export default async function BillingPage() {
  const { supabase, user } = await requireUser();
  const [t, tTiers, tStatus, format] = await Promise.all([
    getTranslations("dashboard.billing"),
    getTranslations("common.tiers"),
    getTranslations("status.subscription"),
    getFormatter(),
  ]);

  const membership = await getUserMembership(user.id);

  let organization: Organization | null = null;
  if (membership) {
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", membership.organizationId)
      .single();
    organization = data;
  }

  // `plan_id` holds a Stripe price id (or nothing); resolve it to a tier rather than matching env vars here.
  const planLabel = organization?.plan_id ? tTiers(resolvePlanTier(organization.plan_id)) : tTiers("free");
  const knownStatus = organization ? asSubscriptionStatus(organization.subscription_status) : null;

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title={t("title")} description={t("description")} />

      {organization ? (
        <Card className="p-6">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <div className="border-b border-slate-800 pb-2">
              <dt className="text-xs font-medium text-slate-400">{t("plan")}</dt>
              <dd className="text-sm font-medium text-slate-100">{planLabel}</dd>
            </div>
            <div className="border-b border-slate-800 pb-2">
              <dt className="text-xs font-medium text-slate-400">{t("status")}</dt>
              <dd className="text-sm font-medium text-slate-100">
                {knownStatus ? tStatus(knownStatus) : organization.subscription_status}
              </dd>
            </div>
            <div className="border-b border-slate-800 pb-2">
              <dt className="text-xs font-medium text-slate-400">{t("renews")}</dt>
              <dd className="text-sm font-medium text-slate-100">
                {organization.current_period_end
                  ? format.dateTime(new Date(organization.current_period_end), { dateStyle: "medium" })
                  : t("notAvailable")}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex items-center gap-3">
            {organization.provider_customer_id ? (
              <BillingPortalButton />
            ) : (
              <Button asChild>
                <Link href="/pricing">{t("choosePlan")}</Link>
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <p className="text-sm text-slate-400">
            {t.rich("noOrganization", {
              link: (chunks) => (
                <Link href="/pricing" className="font-medium text-violet-300 hover:text-violet-200">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </Card>
      )}
    </PageContainer>
  );
}
