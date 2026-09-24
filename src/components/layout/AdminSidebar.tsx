"use client";

import { useTranslations } from "next-intl";
import { getAdminNavGroups } from "@/components/layout/nav-config";
import Sidebar from "@/core/ui/shell/Sidebar";

export default function AdminSidebar() {
  const t = useTranslations("shell");

  return (
    <Sidebar homeHref="/admin" subtitle={t("adminBadge")} groups={getAdminNavGroups()} label={t("nav.adminLabel")} />
  );
}
