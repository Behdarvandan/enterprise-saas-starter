"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  Kanban,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import Logo from "@/components/layout/Logo";

// Order matches the Pasargad admin brief (§5): Dashboard -> Leads/CRM ->
// Müşteriler -> Randevular -> Ödemeler -> Ayarlar. Analytics/Tasks predate
// that brief and aren't part of its spec, but they're working features with
// no replacement, so they stay appended rather than being deleted.
const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Leads/CRM", href: "/admin/leads", icon: Users },
  { label: "Müşteriler", href: "/admin/clients", icon: Building2 },
  { label: "Randevular", href: "/admin/appointments", icon: CalendarDays },
  { label: "Ödemeler", href: "/admin/payments", icon: CreditCard },
  { label: "Ayarlar", href: "/admin/settings", icon: Settings },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Tasks", href: "/admin/tasks", icon: Kanban },
];

/**
 * Sidebar for the admin (operator) portal — mirrors `ClientSidebar`'s
 * structure with admin-specific nav items. Kept as its own small component
 * rather than sharing one with the client portal since the two navs will
 * keep diverging (see Faz 5's audit-log tab, SSO settings, etc.).
 */
export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
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
          <Link href="/admin">
            <Logo subtitle="Admin" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-subtle bg-surface px-4 lg:hidden">
        <Link href="/admin">
          <Logo />
        </Link>
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
            <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>
          </div>
        </div>
      )}
    </>
  );
}
