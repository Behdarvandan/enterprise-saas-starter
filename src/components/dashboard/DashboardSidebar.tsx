"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useState } from "react";
import {
  Boxes,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Settings,
  Users,
  X,
} from "lucide-react";
import type { UserOrganization } from "@/lib/team";
import OrgSwitcher from "./OrgSwitcher";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "Bookings", href: "/dashboard/bookings", icon: CalendarDays },
  { label: "AI Chatbot", href: "/dashboard/chatbot", icon: MessageSquareText },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface DashboardSidebarProps {
  organizations: UserOrganization[];
  activeOrganizationId: string;
}

export default function DashboardSidebar({
  organizations,
  activeOrganizationId,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-violet/15 text-violet-dim"
                : "text-ink-muted hover:bg-surface-raised hover:text-ink-primary"
            }`}
          >
            <item.icon size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-subtle bg-surface lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-subtle px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-control bg-violet text-white">
            <Boxes size={16} />
          </div>
          <span className="text-sm font-semibold text-ink-primary">Nimbus</span>
        </div>
        <OrgSwitcher organizations={organizations} activeOrganizationId={activeOrganizationId} />
        <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-subtle bg-surface px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-control bg-violet text-white">
            <Boxes size={16} />
          </div>
          <span className="text-sm font-semibold text-ink-primary">Nimbus</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-control p-2 text-ink-muted transition-colors hover:bg-surface-raised"
          aria-label="Toggle navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-canvas/70" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-subtle p-4">
              <span className="text-sm font-semibold text-ink-primary">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-control p-2 text-ink-muted transition-colors hover:bg-surface-raised"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <OrgSwitcher organizations={organizations} activeOrganizationId={activeOrganizationId} />
            <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>
          </div>
        </div>
      )}
    </>
  );
}
