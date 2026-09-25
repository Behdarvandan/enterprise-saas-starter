"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/core/ui/primitives/sheet";
import Header from "@/core/ui/shell/Header";
import Toaster from "@/core/ui/shell/Toaster";

interface AppShellProps {
  /** Sidebar content (Sidebar). Rendered in the desktop rail and the mobile drawer. */
  sidebar: ReactNode;
  /** Left side of the header, after the mobile menu button (e.g. search). */
  headerStart?: ReactNode;
  /** Right side of the header (status, notifications, language, user menu). */
  headerEnd?: ReactNode;
  children: ReactNode;
}

/**
 * The one authenticated-portal frame: slate-950 canvas, a fixed sidebar rail
 * from `lg` up and a Sheet drawer below it, a sticky glass header, and the
 * toast viewport. Every portal (dashboard, agency, admin) renders inside it.
 */
export default function AppShell({ sidebar, headerStart, headerEnd, children }: AppShellProps) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer once navigation lands, whatever triggered it.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 lg:flex">
      <a
        href="#main"
        className="sr-only z-[70] rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:start-3 focus:top-3"
      >
        {t("skipToContent")}
      </a>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e border-slate-800 bg-slate-950 lg:block">
        {sidebar}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="start" className="p-0">
          <SheetTitle className="sr-only">{t("navigation")}</SheetTitle>
          <SheetDescription className="sr-only">{t("navigationDescription")}</SheetDescription>
          {sidebar}
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setMobileOpen(true)} headerStart={headerStart} headerEnd={headerEnd} />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  );
}
