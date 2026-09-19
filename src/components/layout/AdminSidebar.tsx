"use client";

import { useTranslations } from "next-intl";
import { getAdminNavGroups } from "@/components/layout/nav-config";
import ShellNav from "@/components/layout/ShellNav";
import SidebarFrame from "@/components/layout/SidebarFrame";

export default function AdminSidebar() {
  const t = useTranslations("shell");

  return (
    <SidebarFrame homeHref="/admin" subtitle={t("adminBadge")}>
      <ShellNav groups={getAdminNavGroups()} label={t("nav.adminLabel")} />
    </SidebarFrame>
  );
}
