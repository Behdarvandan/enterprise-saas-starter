import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getUserMembership, getUserOrganizations } from "@/lib/team";
import { getAdministeredAgency } from "@/lib/agency/admin";
import { fetchCrewInsights } from "@/lib/dev-crew/queries";
import { collapseInsights } from "@/lib/dev-crew/recommendation";
import { getOrganizationSnapshot } from "@/lib/dashboard/queries";
import { LanguageSwitcher } from "@/components/ui/liquid/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/liquid/ThemeToggle";
import AgentStatus from "@/components/layout/AgentStatus";
import type { TenantRole } from "@/core/auth/types";
import { moduleRegistry } from "@/core/registry";
import { TenantProvider, type TenantContext } from "@/core/tenant";
import { SHELL_SLOTS, Slot } from "@/core/ui/slots";
import AppShell from "@/core/ui/shell/AppShell";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import HeaderSearch from "@/components/layout/HeaderSearch";
import NotificationsMenu from "@/components/layout/NotificationsMenu";
import UserMenu from "@/components/layout/UserMenu";
import type { CrewInsight } from "@/types";

const NOTIFICATION_COUNT = 3;

export default async function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  // Next's typed-routes validator requires this to stay `string` here since
  // this segment has no generateStaticParams of its own; the middleware
  // guarantees only routed locales ever reach it, hence the cast below.
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Deliberately not using the shared `requireUser()` helper from
  // `@/lib/auth`: that one redirects via plain `next/navigation`, which
  // would drop the locale prefix. This layout needs next-intl's
  // locale-aware redirect instead. The `return null` never executes
  // (redirect() always throws) but narrows `user` below.
  if (!user) {
    redirect({ href: "/login", locale: locale as Locale });
    return null;
  }

  const [organizations, membership, agency] = await Promise.all([
    getUserOrganizations(user.id),
    getUserMembership(user.id),
    getAdministeredAgency(supabase),
  ]);
  const activeOrganizationId = membership?.organizationId ?? "";

  const activeOrg = organizations.find((org) => org.organizationId === activeOrganizationId) ?? null;
  const initialTenant: TenantContext | null = activeOrg
    ? { id: activeOrg.organizationId, slug: activeOrg.organizationSlug, name: activeOrg.organizationName ?? "" }
    : null;
  const initialUserRole: TenantRole | null = membership?.role ?? null;
  const moduleNavItems = moduleRegistry.getNavigationItems(initialUserRole ?? undefined);

  // Shell status + bell are best-effort chrome: a failure here must never
  // take the whole dashboard down, so each degrades to "no data".
  const [snapshot, notifications] = await Promise.all([
    activeOrganizationId ? getOrganizationSnapshot(activeOrganizationId) : null,
    activeOrganizationId ? loadNotifications(activeOrganizationId) : [],
  ]);
  const agentState = snapshot?.agentState ?? "inactive";
  const quotaPercent = snapshot?.quota.percent ?? 0;

  return (
    <TenantProvider initialTenant={initialTenant} initialUserRole={initialUserRole}>
      <AppShell
        sidebar={
          <DashboardSidebar
            organizations={organizations}
            activeOrganizationId={activeOrganizationId}
            isAgencyAdmin={agency !== null}
            agentState={agentState}
            quotaPercent={quotaPercent}
            moduleNavItems={moduleNavItems}
          />
        }
        headerStart={<HeaderSearch />}
        headerEnd={
          <>
            <Slot id={SHELL_SLOTS.HEADER_ACTIONS} />
            <AgentStatus state={agentState} quotaPercent={Math.round(quotaPercent)} className="hidden md:inline-flex" />
            <NotificationsMenu items={notifications} />
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu email={user.email ?? ""} />
          </>
        }
      >
        {children}
      </AppShell>
    </TenantProvider>
  );
}

async function loadNotifications(organizationId: string): Promise<CrewInsight[]> {
  try {
    const recent = await fetchCrewInsights(organizationId, { limit: 30 });
    return collapseInsights(recent).slice(0, NOTIFICATION_COUNT);
  } catch (error) {
    console.error("[dashboard] notifications unavailable:", error);
    return [];
  }
}
