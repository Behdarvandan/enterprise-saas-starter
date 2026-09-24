"use client";

import { LayoutDashboard, Package, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { switchOrganization } from "@/app/[locale]/dashboard/actions";
import AgentStatus from "@/components/layout/AgentStatus";
import { getDashboardNavGroups } from "@/components/layout/nav-config";
import type { ModuleNavigationItem } from "@/core/registry";
import Sidebar from "@/core/ui/shell/Sidebar";
import TenantSwitcher from "@/core/ui/shell/TenantSwitcher";
import { Link } from "@/i18n/navigation";
import type { AgentState } from "@/lib/dashboard/metrics";
import type { UserOrganization } from "@/lib/team";

/**
 * Curated, safe string→icon lookup — an explicit allowlist rather than a
 * dynamic index into every lucide-react export, so an unrecognized or
 * mistyped module icon name can never resolve to an unintended icon.
 */
const MODULE_ICONS: Record<string, LucideIcon> = { LayoutDashboard, Package };
const FALLBACK_MODULE_ICON: LucideIcon = Package;

function resolveModuleIcon(iconName: string | undefined): LucideIcon {
  if (!iconName) return FALLBACK_MODULE_ICON;
  return MODULE_ICONS[iconName] ?? FALLBACK_MODULE_ICON;
}

interface DashboardSidebarProps {
  organizations: UserOrganization[];
  activeOrganizationId: string;
  isAgencyAdmin: boolean;
  agentState: AgentState;
  quotaPercent: number;
  moduleNavItems?: ModuleNavigationItem[];
}

/** Tenant dashboard sidebar: org switcher on top, grouped nav, live agent status pinned below. */
export default function DashboardSidebar({
  organizations,
  activeOrganizationId,
  isAgencyAdmin,
  agentState,
  quotaPercent,
  moduleNavItems = [],
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
      bottom={
        <>
          {moduleNavItems.length > 0 ? (
            <div className="mb-3 flex flex-col gap-0.5">
              <p className="px-3 pb-1 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                {t("groups.modules")}
              </p>
              {moduleNavItems.map((item) => {
                const Icon = resolveModuleIcon(item.icon);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors outline-none hover:bg-slate-900 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    <Icon aria-hidden className="size-4 shrink-0 text-slate-500" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          ) : null}
          <AgentStatus state={agentState} quotaPercent={Math.round(quotaPercent)} className="w-full" />
        </>
      }
    />
  );
}
