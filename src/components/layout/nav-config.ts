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
  type LucideIcon,
} from "lucide-react";

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

export interface ShellNavItem {
  labelKey: NavLabelKey;
  href: string;
  icon: LucideIcon;
}

export interface ShellNavGroup {
  /** Omitted for the ungrouped lead section. */
  labelKey?: NavGroupKey;
  items: ShellNavItem[];
}

export function getDashboardNavGroups(isAgencyAdmin: boolean): ShellNavGroup[] {
  const groups: ShellNavGroup[] = [
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

export function getAgencyNavGroups(): ShellNavGroup[] {
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

export function getAdminNavGroups(): ShellNavGroup[] {
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

/**
 * The single nav entry that owns `pathname`: the longest href that equals it
 * or is a path-segment prefix of it. Longest-match means a nested route
 * highlights its own entry rather than also lighting up its parent's.
 */
export function resolveActiveHref(pathname: string, hrefs: readonly string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (matches && (best === null || href.length > best.length)) best = href;
  }
  return best;
}
