"use client";

import { useTranslations } from "next-intl";
import { switchOrganization } from "@/app/[locale]/dashboard/actions";
import AgentStatus from "@/components/layout/AgentStatus";
import { getDashboardNavGroups } from "@/components/layout/nav-config";
import Sidebar from "@/core/ui/shell/Sidebar";
import TenantSwitcher from "@/core/ui/shell/TenantSwitcher";
import type { AgentState } from "@/lib/dashboard/metrics";
import type { UserOrganization } from "@/lib/team";

interface DashboardSidebarProps {
  organizations: UserOrganization[];
  activeOrganizationId: string;
  isAgencyAdmin: boolean;
  agentState: AgentState;
  quotaPercent: number;
}

/** Tenant dashboard sidebar: org switcher on top, grouped nav, live agent status pinned below. */
export default function DashboardSidebar({
  organizations,
  activeOrganizationId,
  isAgencyAdmin,
  agentState,
  quotaPercent,
}: DashboardSidebarProps) {
  const t = useTranslations("shell");

  return (
    <Sidebar
      homeHref="/dashboard"
      top={
        <TenantSwitcher
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
          onSwitch={switchOrganization}
        />
      }
      groups={getDashboardNavGroups(isAgencyAdmin)}
      label={t("nav.dashboardLabel")}
      bottom={<AgentStatus state={agentState} quotaPercent={Math.round(quotaPercent)} className="w-full" />}
    />
  );
}
