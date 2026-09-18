"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useState } from "react";
import { ArrowLeft, BarChart3, Building2, Menu, Palette, X } from "lucide-react";
import Logo from "@/components/layout/Logo";

const NAV_ITEMS = [
  { label: "Tenants", href: "/agency/tenants", icon: Building2 },
  { label: "Branding & domain", href: "/agency/branding", icon: Palette },
  { label: "Analytics", href: "/agency/analytics", icon: BarChart3 },
];

interface AgencySidebarProps {
  agencyName: string;
}

/**
 * Sidebar for the agency portal — the counterpart to `AdminSidebar` for the
 * operator portal. Kept separate because the two navs diverge.
 */
export default function AgencySidebar({ agencyName }: AgencySidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <>
      <nav aria-label="Agency portal" className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
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
      <div className="mt-4 border-t border-subtle pt-4">
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink-primary"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-subtle bg-surface lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-subtle px-4">
          <Link href="/agency/tenants">
            <Logo subtitle="Agency portal" />
          </Link>
        </div>
        <p className="truncate border-b border-subtle px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {agencyName}
        </p>
        <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-subtle bg-surface px-4 lg:hidden">
        <Link href="/agency/tenants">
          <Logo subtitle="Agency portal" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-control p-2 text-ink-muted transition-colors hover:bg-surface-raised"
          aria-label="Toggle navigation"
          aria-expanded={open}
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
