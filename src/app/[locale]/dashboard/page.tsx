import { CalendarClock, CalendarX2, Gauge, MessagesSquare, ShieldCheck } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import ChatSimulator from "@/components/chat-widget/ChatSimulator";
import AppointmentStatusBadge from "@/components/dashboard/AppointmentStatusBadge";
import LatestCrewAlert from "@/components/dashboard/LatestCrewAlert";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/core/ui/primitives/button";
import { LiquidCard } from "@/components/ui/liquid/LiquidCard";
import EmptyState from "@/components/ui/EmptyState";
import LiveRefresh from "@/components/ui/LiveRefresh";
import MetricCard from "@/components/ui/MetricCard";
import { Progress } from "@/core/ui/primitives/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/primitives/table";
import { Tooltip } from "@/core/ui/primitives/tooltip";
import { SHELL_SLOTS } from "@/core/ui/slots";
import Slot from "@/core/ui/slots/Slot";
import { Link } from "@/i18n/navigation";
import { requireMembership } from "@/lib/auth";
import { getOverviewMetrics, getOrganizationSnapshot } from "@/lib/dashboard/queries";
import { LIVE_WINDOW_MINUTES, RAG_WINDOW_DAYS } from "@/lib/dashboard/metrics";
import { fetchCrewInsights } from "@/lib/dev-crew/queries";
import { collapseInsights } from "@/lib/dev-crew/recommendation";
import { formatMetricNumber, formatMetricPercent } from "@/lib/format";
import { resolvePlanTier } from "@/lib/plans";
import { asSubscriptionStatus } from "@/lib/status";
import type { CrewInsight } from "@/types";

export const dynamic = "force-dynamic";

const SUBSCRIPTION_TONE: Record<string, BadgeTone> = {
  active: "success",
  trialing: "success",
  past_due: "warn",
  canceled: "error",
};

async function loadLatestInsight(organizationId: string): Promise<CrewInsight | null> {
  try {
    // Fetch a page, not one row: duplicates are collapsed so the widget
    // shows the newest *distinct* recommendation.
    const [latest] = collapseInsights(await fetchCrewInsights(organizationId, { limit: 20 }));
    return latest ?? null;
  } catch (error) {
    console.error("[overview] crew insight unavailable:", error);
    return null;
  }
}

export default async function DashboardPage() {
  const { supabase, user, membership } = await requireMembership();
  const organizationId = membership.organizationId;

  const [t, tStatus, tTiers, locale, format] = await Promise.all([
    getTranslations("dashboard.overview"),
    getTranslations("status"),
    getTranslations("common.tiers"),
    getLocale(),
    getFormatter(),
  ]);

  const [snapshot, metrics, insight, memberCount, services, recent] = await Promise.all([
    getOrganizationSnapshot(organizationId),
    getOverviewMetrics(organizationId),
    loadLatestInsight(organizationId),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase.from("services").select("id, name").eq("organization_id", organizationId),
    supabase
      .from("appointments")
      .select("id, customer_name, service_id, start_time, status")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const serviceNameById = new Map((services.data ?? []).map((service) => [service.id, service.name]));
  const appointments = recent.data ?? [];

  const checklistItems = [
    { id: "org", label: t("checklist.org"), href: "/dashboard/settings/organization", done: snapshot !== null },
    { id: "team", label: t("checklist.team"), href: "/dashboard/team", done: (memberCount.count ?? 0) > 1 },
    { id: "service", label: t("checklist.service"), href: "/dashboard/bookings", done: (services.data?.length ?? 0) > 0 },
    { id: "kb", label: t("checklist.kb"), href: "/dashboard/knowledge-base", done: metrics.documents > 0 },
  ];

  const tier = resolvePlanTier(snapshot?.planId);
  const planName = tTiers(tier);
  const subscriptionStatus = snapshot?.subscriptionStatus ?? "inactive";
  const knownSubscription = asSubscriptionStatus(subscriptionStatus);
  const quota = snapshot?.quota;

  return (
    <PageContainer>
      <LiveRefresh />
      <PageHeader
        title={t("title")}
        description={user.email ? t("welcome", { email: user.email }) : t("welcomeAnonymous")}
        actions={
          <>
            <Badge tone={SUBSCRIPTION_TONE[subscriptionStatus] ?? "neutral"}>
              {knownSubscription ? tStatus(`subscription.${knownSubscription}`) : subscriptionStatus}
            </Badge>
            <span className="hidden text-sm text-muted-foreground sm:inline">{t("plan", { plan: planName })}</span>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/billing">{t("manageBilling")}</Link>
            </Button>
          </>
        }
      />

      <section aria-label={t("title")} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          live={metrics.liveChats > 0}
          icon={MessagesSquare}
          label={t("metrics.liveChats.label")}
          value={formatMetricNumber(locale, metrics.liveChats)}
          hint={t("metrics.liveChats.hint", { minutes: LIVE_WINDOW_MINUTES })}
        />

        <MetricCard
          icon={ShieldCheck}
          label={t("metrics.ragSuccess.label")}
          value={metrics.ragSuccessPercent === null ? "—" : formatMetricPercent(locale, metrics.ragSuccessPercent)}
          hint={
            metrics.ragSuccessPercent === null
              ? t("metrics.ragSuccess.empty")
              : t("metrics.ragSuccess.hint", { count: metrics.ragCompletions, days: RAG_WINDOW_DAYS })
          }
        >
          <Tooltip content={t("metrics.ragSuccess.tooltip")}>
            <button
              type="button"
              className="self-start rounded text-xs text-muted-foreground underline decoration-dotted underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {t("metrics.ragSuccess.label")}?
            </button>
          </Tooltip>
        </MetricCard>

        <MetricCard
          icon={Gauge}
          label={t("metrics.quota.label")}
          value={quota ? formatMetricNumber(locale, quota.tokensUsed) : "—"}
          hint={
            quota
              ? quota.resetsAt
                ? t("metrics.quota.hint", {
                    limit: formatMetricNumber(locale, quota.tokensLimit),
                    date: format.dateTime(quota.resetsAt, { dateStyle: "medium" }),
                  })
                : t("metrics.quota.hintNoReset", { limit: formatMetricNumber(locale, quota.tokensLimit) })
              : undefined
          }
        >
          {quota ? (
            <Progress value={quota.percent} tone={quota.tone} aria-label={t("metrics.quota.usage")} />
          ) : null}
        </MetricCard>

        <MetricCard
          icon={CalendarClock}
          label={t("metrics.bookings.label")}
          value={formatMetricNumber(locale, metrics.bookingsThisWeek)}
          hint={t("metrics.bookings.hint")}
        />
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Slot id={SHELL_SLOTS.DASHBOARD_OVERVIEW} />
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <ChatSimulator organizationId={organizationId} className="lg:col-span-2" />
        <div className="flex flex-col gap-6">
          <LatestCrewAlert insight={insight} />
          <OnboardingChecklist userId={user.id} items={checklistItems} />
        </div>
      </section>

      <LiquidCard className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{t("recent.title")}</h2>
          <Link href="/dashboard/bookings" className="text-sm font-medium text-primary hover:text-primary">
            {t("recent.viewAll")}
          </Link>
        </div>

        {appointments.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title={t("recent.emptyTitle")}
            description={t("recent.emptyDescription")}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {snapshot ? (
                  <Button asChild size="sm">
                    <Link href={`/book/${snapshot.slug}`} target="_blank" rel="noopener noreferrer">
                      {t("recent.simulate")}
                    </Link>
                  </Button>
                ) : null}
                <Button asChild variant="secondary" size="sm">
                  <Link href="/dashboard/chatbot">{t("recent.testAgent")}</Link>
                </Button>
              </div>
            }
          />
        ) : (
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>{t("recent.customer")}</TableHead>
                <TableHead>{t("recent.service")}</TableHead>
                <TableHead>{t("recent.date")}</TableHead>
                <TableHead>{t("recent.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium text-foreground">{appointment.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {serviceNameById.get(appointment.service_id) ?? t("recent.fallbackService")}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {/* Appointments are anchored to UTC by the booking engine. */}
                    {format.dateTime(new Date(appointment.start_time), {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "UTC",
                      numberingSystem: "latn",
                    })}
                  </TableCell>
                  <TableCell>
                    <AppointmentStatusBadge status={appointment.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </LiquidCard>
    </PageContainer>
  );
}
