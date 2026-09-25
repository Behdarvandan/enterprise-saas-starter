import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Building2, Clock, TrendingUp, Wallet } from "lucide-react";
import SaasRevenueChart, { type PlanRevenuePoint } from "@/components/admin/SaasRevenueChart";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Badge } from "@/core/ui/primitives/badge";
import { Card } from "@/core/ui/primitives/card";
import EmptyState from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/primitives/table";
import { formatMoney } from "@/lib/format";
import { requireOperatorAdmin } from "@/lib/operator";
import { getAllPlans, type Plan, type PlanCheckout } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { asSubscriptionStatus, type KnownSubscriptionStatus } from "@/lib/status";
import { ExtendTrialButton } from "./ExtendTrialButton";

export const dynamic = "force-dynamic";

const EXPIRING_SOON_DAYS = 7;

const STATUS_VARIANT: Record<KnownSubscriptionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trialing: "default",
  past_due: "secondary",
  canceled: "destructive",
  inactive: "outline",
};

function isStripePlan(plan: Plan): plan is Plan & { checkout: Extract<PlanCheckout, { kind: "stripe" }> } {
  return plan.checkout.kind === "stripe";
}

interface TenantOrganization {
  id: string;
  name: string;
  slug: string;
  subscription_status: string;
  trial_ends_at: string | null;
  plan_id: string | null;
  created_at: string;
}

export default async function AdminTenantsPage() {
  await requireOperatorAdmin();
  const [t, tTiers, tStatus, locale, format] = await Promise.all([
    getTranslations("admin.tenants"),
    getTranslations("common.tiers"),
    getTranslations("status.subscription"),
    getLocale(),
    getFormatter(),
  ]);

  // Service-role client: this page reaches across every tenant organization
  // on the platform, not just the caller's own — the same bypass-RLS pattern
  // already used elsewhere (e.g. getOperatorOrganizationId, the Lemon
  // Squeezy webhook handler) for system-level reads.
  const admin = createAdminClient();
  const { data: organizations } = await admin
    .from("organizations")
    .select("id, name, slug, subscription_status, trial_ends_at, plan_id, created_at")
    .order("created_at", { ascending: false })
    .returns<TenantOrganization[]>();

  const orgs = organizations ?? [];
  const now = Date.now();
  const expiringSoonCutoff = now + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000;

  const stats = {
    total: orgs.length,
    active: orgs.filter((o) => o.subscription_status === "active").length,
    trialing: orgs.filter((o) => o.subscription_status === "trialing").length,
    pastDue: orgs.filter((o) => o.subscription_status === "past_due").length,
    canceled: orgs.filter((o) => o.subscription_status === "canceled").length,
    expiringSoon: orgs.filter(
      (o) =>
        o.subscription_status === "trialing" &&
        o.trial_ends_at &&
        new Date(o.trial_ends_at).getTime() <= expiringSoonCutoff,
    ).length,
  };

  // MRR by plan — only Stripe-checkout plans are matchable against plan_id
  // (PayTR never sets it, Lemon Squeezy stores a variant name, Enterprise is
  // contact-only), so this is a floor on real revenue, not the full total.
  // Mirrors src/app/[locale]/admin/analytics/page.tsx's own computation.
  const saasRevenue: PlanRevenuePoint[] = getAllPlans()
    .filter(isStripePlan)
    .map((plan) => {
      const matching = orgs.filter(
        (org) =>
          ["active", "trialing"].includes(org.subscription_status) &&
          plan.checkout.priceId &&
          org.plan_id === plan.checkout.priceId,
      ).length;
      return {
        plan: `${tTiers(plan.tier)} (${plan.region.toUpperCase()})`,
        amount: matching * (plan.checkout.amount / 100),
        organizations: matching,
      };
    });
  const mrr = saasRevenue.reduce((sum, point) => sum + point.amount, 0);
  const arr = mrr * 12;

  const statTiles: { label: string; value: string | number; icon: typeof Building2 }[] = [
    { label: t("stat.total"), value: stats.total, icon: Building2 },
    { label: t("stat.active"), value: stats.active, icon: TrendingUp },
    { label: t("stat.trialing"), value: stats.trialing, icon: Clock },
    { label: t("stat.expiringSoon"), value: stats.expiringSoon, icon: Clock },
  ];

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title={t("title")} description={t("description")} />

      <section>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{t("healthTitle")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statTiles.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon aria-hidden className="size-4" />
                <p className="text-xs font-medium">{label}</p>
              </div>
              <p dir="ltr" className="mt-2 text-start font-mono text-2xl font-semibold tabular-nums text-foreground">
                {value}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <Card className="p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
            <Wallet aria-hidden className="size-4 text-primary" />
            {t("mrrTitle")}
          </h2>
          <div dir="ltr" className="text-end">
            <span className="font-mono text-lg font-semibold tabular-nums text-primary">
              {formatMoney(locale, mrr * 100)}
            </span>
            <p className="text-xs text-muted-foreground">
              {t("arrLabel")}: {formatMoney(locale, arr * 100)}
            </p>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{t("mrrSubtitle")}</p>
        <div className="mt-4">
          <SaasRevenueChart data={saasRevenue} />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {orgs.length === 0 ? (
          <EmptyState icon={Building2} title={t("empty")} description={t("description")} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.name")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.trial")}</TableHead>
                  <TableHead>{t("table.plan")}</TableHead>
                  <TableHead>{t("table.created")}</TableHead>
                  <TableHead>{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((org) => {
                  const status = asSubscriptionStatus(org.subscription_status);
                  const daysLeft = org.trial_ends_at
                    ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - now) / (24 * 60 * 60 * 1000)))
                    : null;

                  return (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium text-foreground">
                        <p>{org.name}</p>
                        <p dir="ltr" className="text-xs text-muted-foreground">
                          {org.slug}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status ? STATUS_VARIANT[status] : "outline"}>
                          {status ? tStatus(status) : org.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {org.trial_ends_at
                          ? daysLeft !== null && daysLeft > 0
                            ? t("trialDaysLeft", { days: daysLeft })
                            : t("trialEndedLabel")
                          : t("noTrial")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{org.plan_id ?? tTiers("free")}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format.dateTime(new Date(org.created_at), { dateStyle: "medium" })}
                      </TableCell>
                      <TableCell>
                        <ExtendTrialButton organizationId={org.id} organizationName={org.name} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
