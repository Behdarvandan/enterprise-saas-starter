import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import BillingPortalButton from "@/components/billing/BillingPortalButton";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { LiquidCard } from "@/components/ui/liquid/LiquidCard";
import { LemonSqueezyCheckoutButton } from "@/modules/billing/components/LemonSqueezyCheckoutButton";
import { getLemonSqueezyInvoices } from "@/modules/billing";
import EmptyState from "@/components/ui/EmptyState";
import { Receipt } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/primitives/table";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { resolvePlanTier } from "@/lib/plans";
import { asSubscriptionStatus } from "@/lib/status";
import { getUserMembership } from "@/lib/team";
import type { Organization } from "@/types";

/** Whole days between now and `trialEndsAt`, floored at 0 (never negative). */
function daysUntil(trialEndsAt: string): number {
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

const TRIAL_LENGTH_DAYS = 14;

export default async function BillingPage() {
  const { supabase, user } = await requireUser();
  const [t, tTiers, tStatus, format, locale] = await Promise.all([
    getTranslations("dashboard.billing"),
    getTranslations("common.tiers"),
    getTranslations("status.subscription"),
    getFormatter(),
    getLocale(),
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

  const isTrialing = organization?.subscription_status === "trialing" && organization.trial_ends_at;
  const daysLeft = isTrialing ? daysUntil(organization!.trial_ends_at as string) : null;
  const trialProgressPct =
    daysLeft !== null ? Math.min(100, Math.round(((TRIAL_LENGTH_DAYS - daysLeft) / TRIAL_LENGTH_DAYS) * 100)) : 0;
  const needsUpgrade =
    organization && ["trialing", "past_due", "canceled", "inactive"].includes(organization.subscription_status);

  const invoices = organization?.provider_subscription_id
    ? await getLemonSqueezyInvoices(organization.provider_subscription_id)
    : [];

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title={t("title")} description={t("description")} />

      {isTrialing && daysLeft !== null ? (
        <LiquidCard className="p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">{t("trialCountdown", { days: daysLeft })}</p>
            <span className="text-xs text-muted-foreground">{TRIAL_LENGTH_DAYS - daysLeft}/{TRIAL_LENGTH_DAYS}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${trialProgressPct}%` }}
            />
          </div>
        </LiquidCard>
      ) : null}

      {organization?.subscription_status === "inactive" || organization?.subscription_status === "past_due" ? (
        <LiquidCard className="border-transparent p-5">
          <p className="text-sm font-medium text-foreground">{t("trialExpiredBanner")}</p>
        </LiquidCard>
      ) : null}

      {organization ? (
        <LiquidCard className="p-6">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <div className="border-b border-border pb-2">
              <dt className="text-xs font-medium text-muted-foreground">{t("plan")}</dt>
              <dd className="text-sm font-medium text-foreground">{planLabel}</dd>
            </div>
            <div className="border-b border-border pb-2">
              <dt className="text-xs font-medium text-muted-foreground">{t("status")}</dt>
              <dd className="text-sm font-medium text-foreground">
                {knownStatus ? tStatus(knownStatus) : organization.subscription_status}
              </dd>
            </div>
            <div className="border-b border-border pb-2">
              <dt className="text-xs font-medium text-muted-foreground">{t("renews")}</dt>
              <dd className="text-sm font-medium text-foreground">
                {organization.current_period_end
                  ? format.dateTime(new Date(organization.current_period_end), { dateStyle: "medium" })
                  : t("notAvailable")}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {organization.provider_customer_id ? <BillingPortalButton /> : null}
            {needsUpgrade ? (
              <>
                <LemonSqueezyCheckoutButton interval="monthly" label={t("upgradeMonthly")} size="default" />
                <LemonSqueezyCheckoutButton interval="yearly" label={t("upgradeYearly")} size="default" />
              </>
            ) : null}
          </div>
        </LiquidCard>
      ) : (
        <LiquidCard className="p-6">
          <p className="text-sm text-muted-foreground">
            {t.rich("noOrganization", {
              link: (chunks) => (
                <Link href="/pricing" className="font-medium text-primary hover:text-primary-hover">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </LiquidCard>
      )}

      {organization?.provider_subscription_id ? (
        <LiquidCard className="overflow-hidden p-0">
          <div className="flex items-center gap-2 p-6 pb-0">
            <Receipt aria-hidden className="size-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight text-foreground">{t("invoiceHistory.title")}</h2>
          </div>
          {invoices.length === 0 ? (
            <EmptyState icon={Receipt} title={t("invoiceHistory.emptyTitle")} description={t("invoiceHistory.emptyDescription")} />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("invoiceHistory.date")}</TableHead>
                    <TableHead>{t("invoiceHistory.amount")}</TableHead>
                    <TableHead>{t("invoiceHistory.status")}</TableHead>
                    <TableHead>{t("invoiceHistory.receipt")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="text-muted-foreground">
                        {format.dateTime(new Date(invoice.createdAt), { dateStyle: "medium" })}
                      </TableCell>
                      <TableCell dir="ltr" className="text-start font-mono text-xs text-foreground">
                        {formatMoney(locale, invoice.total, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{invoice.status}</TableCell>
                      <TableCell>
                        {invoice.invoiceUrl ? (
                          <a
                            href={invoice.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:text-primary-hover"
                          >
                            {t("invoiceHistory.view")}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </LiquidCard>
      ) : null}
    </PageContainer>
  );
}
