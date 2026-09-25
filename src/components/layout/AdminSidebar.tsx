"use client";

import { useTranslations } from "next-intl";
import { getAdminNavGroups } from "@/components/layout/nav-config";
import Logo from "@/components/layout/Logo";
import Sidebar from "@/core/ui/shell/Sidebar";

export default function AdminSidebar() {
  const t = useTranslations("shell");

  return (
    <Sidebar
      homeHref="/admin"
      logo={
        <div className="flex flex-col gap-0.5">
          <Logo />
          <span className="block text-xs text-slate-400">{t("adminBadge")}</span>
        </div>
      }
      groups={getAdminNavGroups()}
      label={t("nav.adminLabel")}
    />
  );
}
