"use client";

import { useTranslations } from "next-intl";
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";
import Logo from "@/components/layout/Logo";
import UserMenu from "@/components/layout/UserMenu";
import { Link, usePathname } from "@/i18n/navigation";
import { resolveActiveHref } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

interface ClientTopbarProps {
  userEmail: string;
}

/**
 * Sole navigation surface for the client portal — deliberately minimal: logo
 * and four items, top nav only, no sidebar (a customer-facing surface, not an
 * operator console).
 */
export default function ClientTopbar({ userEmail }: ClientTopbarProps) {
  const t = useTranslations("client");
  const pathname = usePathname();

  const items = [
    { label: t("nav.projectStatus"), href: "/client" },
    { label: t("nav.payments"), href: "/client/invoices" },
    { label: t("nav.files"), href: "/client/files" },
    { label: t("nav.settings"), href: "/client/settings" },
  ];
  const activeHref = resolveActiveHref(pathname, items.map((item) => item.href));

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/client" className="shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
          <Logo />
        </Link>

        <nav aria-label={t("topbar.navLabel")} className="flex flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap">
          {items.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "border-b-2 px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  active ? "border-primary text-slate-100" : "border-transparent text-slate-400 hover:text-slate-100",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LocaleSwitcher />
          <UserMenu email={userEmail} />
        </div>
      </div>
    </header>
  );
}
