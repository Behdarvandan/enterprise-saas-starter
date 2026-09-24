import {
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  Database,
  Kanban,
  LayoutDashboard,
  Lightbulb,
  MessagesSquare,
  Palette,
  Settings,
  SlidersHorizontal,
  Users,
  UserSquare2,
  Wallet,
} from "lucide-react";
import type { ShellNavGroup } from "@/core/ui/shell/Sidebar";

export { resolveActiveHref } from "@/core/ui/shell/Sidebar";

/** Keys under `shell.nav` in the message catalogs. */
export type NavLabelKey =
  | "overview"
  | "knowledgeBase"
  | "testAgent"
  | "skills"
  | "crewInsights"
  | "bookings"
  | "team"
  | "billing"
  | "settings"
  | "agencyPortal"
  | "adminDashboard"
  | "adminLeads"
  | "adminClients"
  | "adminAppointments"
  | "adminPayments"
  | "adminSettings"
  | "adminAnalytics"
  | "adminTasks"
  | "agencyTenants"
  | "agencyBranding"
  | "agencyAnalytics";

/** Keys under `shell.groups`. */
export type NavGroupKey = "agent" | "business" | "agency" | "operations";

export function getDashboardNavGroups(isAgencyAdmin: boolean): ShellNavGroup<NavLabelKey, NavGroupKey>[] {
  const groups: ShellNavGroup<NavLabelKey, NavGroupKey>[] = [
    { items: [{ labelKey: "overview", href: "/dashboard", icon: LayoutDashboard }] },
    {
      labelKey: "agent",
      items: [
        { labelKey: "knowledgeBase", href: "/dashboard/knowledge-base", icon: Database },
        { labelKey: "testAgent", href: "/dashboard/chatbot", icon: MessagesSquare },
        { labelKey: "skills", href: "/dashboard/skills", icon: SlidersHorizontal },
        { labelKey: "crewInsights", href: "/dashboard/crew-insights", icon: Lightbulb },
      ],
    },
    {
      labelKey: "business",
      items: [
        { labelKey: "bookings", href: "/dashboard/bookings", icon: CalendarDays },
        { labelKey: "team", href: "/dashboard/team", icon: Users },
        { labelKey: "billing", href: "/dashboard/billing", icon: CreditCard },
        { labelKey: "settings", href: "/dashboard/settings", icon: Settings },
      ],
    },
  ];

  // Visibility only: the agency portal enforces access itself.
  if (isAgencyAdmin) {
    groups.push({
      labelKey: "agency",
      items: [{ labelKey: "agencyPortal", href: "/agency/tenants", icon: Building2 }],
    });
  }

  return groups;
}

export function getAgencyNavGroups(): ShellNavGroup<NavLabelKey, NavGroupKey>[] {
  return [
    {
      items: [
        { labelKey: "agencyTenants", href: "/agency/tenants", icon: Building2 },
        { labelKey: "agencyBranding", href: "/agency/branding", icon: Palette },
        { labelKey: "agencyAnalytics", href: "/agency/analytics", icon: BarChart3 },
      ],
    },
  ];
}

export function getAdminNavGroups(): ShellNavGroup<NavLabelKey, NavGroupKey>[] {
  return [
    { items: [{ labelKey: "adminDashboard", href: "/admin", icon: LayoutDashboard }] },
    {
      labelKey: "operations",
      items: [
        { labelKey: "adminLeads", href: "/admin/leads", icon: UserSquare2 },
        { labelKey: "adminClients", href: "/admin/clients", icon: Building2 },
        { labelKey: "adminAppointments", href: "/admin/appointments", icon: CalendarDays },
        { labelKey: "adminPayments", href: "/admin/payments", icon: Wallet },
        { labelKey: "adminTasks", href: "/admin/tasks", icon: Kanban },
        { labelKey: "adminAnalytics", href: "/admin/analytics", icon: BarChart3 },
        { labelKey: "adminSettings", href: "/admin/settings", icon: Settings },
      ],
    },
  ];
}
