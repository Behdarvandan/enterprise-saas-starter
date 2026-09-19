"use client";

import { useTranslations } from "next-intl";
import AgentStatus from "@/components/layout/AgentStatus";
import { getDashboardNavGroups } from "@/components/layout/nav-config";
import OrgSwitcher from "@/components/layout/OrgSwitcher";
import ShellNav from "@/components/layout/ShellNav";
import SidebarFrame from "@/components/layout/SidebarFrame";
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
    <SidebarFrame
      homeHref="/dashboard"
      top={<OrgSwitcher organizations={organizations} activeOrganizationId={activeOrganizationId} />}
      bottom={<AgentStatus state={agentState} quotaPercent={Math.round(quotaPercent)} className="w-full" />}
    >
      <ShellNav groups={getDashboardNavGroups(isAgencyAdmin)} label={t("nav.dashboardLabel")} />
    </SidebarFrame>
  );
}
