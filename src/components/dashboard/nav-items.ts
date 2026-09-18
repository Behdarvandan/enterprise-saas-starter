import {
  Building2,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Lightbulb,
  MessageSquareText,
  Settings,
  Sliders,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: DashboardNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "Bookings", href: "/dashboard/bookings", icon: CalendarDays },
  { label: "AI Chatbot", href: "/dashboard/chatbot", icon: MessageSquareText },
  { label: "Preview Your AI Agent", href: "/dashboard/chatbot", icon: Sparkles },
  { label: "Skills", href: "/dashboard/skills", icon: Sliders },
  { label: "Dev Crew Insights", href: "/dashboard/crew-insights", icon: Lightbulb },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const AGENCY_PORTAL_ITEM: DashboardNavItem = {
  label: "Agency Portal",
  href: "/agency/tenants",
  icon: Building2,
};

/**
 * The dashboard sidebar's entries. "Agency Portal" is only listed for agency
 * admins; the portal's own pages still enforce that themselves (this is
 * visibility, not authorization).
 */
export function getDashboardNavItems(isAgencyAdmin: boolean): DashboardNavItem[] {
  return isAgencyAdmin ? [...NAV_ITEMS, AGENCY_PORTAL_ITEM] : NAV_ITEMS;
}
