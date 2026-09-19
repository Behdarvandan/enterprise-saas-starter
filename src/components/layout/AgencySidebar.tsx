"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { getAgencyNavGroups } from "@/components/layout/nav-config";
import ShellNav from "@/components/layout/ShellNav";
import SidebarFrame from "@/components/layout/SidebarFrame";
import { Link } from "@/i18n/navigation";

interface AgencySidebarProps {
  agencyName: string;
}

export default function AgencySidebar({ agencyName }: AgencySidebarProps) {
  const t = useTranslations("shell");

  return (
    <SidebarFrame
      homeHref="/agency/tenants"
      subtitle={agencyName}
      bottom={
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors outline-none hover:bg-slate-900 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" />
          {t("backToDashboard")}
        </Link>
      }
    >
      <ShellNav groups={getAgencyNavGroups()} label={t("nav.agencyLabel")} />
    </SidebarFrame>
  );
}
