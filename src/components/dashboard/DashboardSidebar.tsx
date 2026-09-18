"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { UserOrganization } from "@/lib/team";
import Logo from "@/components/layout/Logo";
import { getDashboardNavItems } from "./nav-items";
import OrgSwitcher from "./OrgSwitcher";

interface DashboardSidebarProps {
  organizations: UserOrganization[];
  activeOrganizationId: string;
  /** Shows the "Agency Portal" entry; visibility only, the portal re-checks access itself. */
  isAgencyAdmin?: boolean;
}

export default function DashboardSidebar({
  organizations,
  activeOrganizationId,
  isAgencyAdmin = false,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {getDashboardNavItems(isAgencyAdmin).map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.label}
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
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <OrgSwitcher organizations={organizations} activeOrganizationId={activeOrganizationId} />
        <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-subtle bg-surface px-4 lg:hidden">
        <Link href="/dashboard">
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
            <OrgSwitcher organizations={organizations} activeOrganizationId={activeOrganizationId} />
            <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>
          </div>
        </div>
      )}
    </>
  );
}
