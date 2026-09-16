"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { User } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";
import Logo from "@/components/layout/Logo";

interface ClientTopbarProps {
  userEmail: string;
}

/**
 * Sole navigation surface for the client portal — brief §6: "Deliberately
 * minimal and fully neutral — no purple, no sidebar. Top nav only." Replaces
 * the old `ClientSidebar` entirely; logo + the 4 locked nav items now live
 * here instead of in a side rail.
 */
export default function ClientTopbar({ userEmail }: ClientTopbarProps) {
  const t = useTranslations("client.nav");
  const pathname = usePathname();
  const [userOpen, setUserOpen] = useState(false);

  const NAV_ITEMS = [
    { label: t("projectStatus"), href: "/client" },
    { label: t("payments"), href: "/client/invoices" },
    { label: t("files"), href: "/client/files" },
    { label: t("settings"), href: "/client/settings" },
  ];

  function isActive(href: string) {
    if (href === "/client") return pathname === "/client";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-subtle bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/client" className="shrink-0">
          <Logo />
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-primary text-ink-primary"
                    : "border-transparent text-ink-muted hover:text-ink-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LocaleSwitcher />

          <div className="relative">
            <button
              type="button"
              onClick={() => setUserOpen((value) => !value)}
              aria-label="User menu"
              aria-expanded={userOpen}
              className="flex h-9 w-9 items-center justify-center rounded-control border border-subtle text-ink-muted transition-colors hover:text-ink-primary"
            >
              <User size={16} />
            </button>
            {userOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-control border border-subtle bg-surface-raised p-3 shadow-lg">
                <p className="truncate text-sm font-medium text-ink-primary">{userEmail}</p>
                <div className="mt-3 border-t border-subtle pt-3">
                  <SignOutButton className="w-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
