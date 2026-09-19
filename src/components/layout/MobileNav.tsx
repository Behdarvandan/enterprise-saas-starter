"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";
import Logo from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import LiveDot from "@/components/ui/LiveDot";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";

export interface MarketingNavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  links: readonly MarketingNavLink[];
}

/** Hamburger drawer for the marketing header below the `md` breakpoint. */
export default function MobileNav({ links }: MobileNavProps) {
  const t = useTranslations("marketing.landing.nav");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("openMenu")}>
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="end" className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Logo />
          </SheetTitle>
          <SheetDescription className="flex items-center gap-1.5">
            <LiveDot />
            {t("agentOs")}
          </SheetDescription>
        </SheetHeader>

        <nav aria-label={t("menuTitle")} className="mt-2 grid gap-1">
          {links.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="rounded-lg px-3 py-3 text-base font-medium text-slate-200 transition-colors hover:bg-slate-800/60 focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>

        <div className="mt-auto grid gap-3">
          <LocaleSwitcher className="w-full justify-start" />
          <SheetClose asChild>
            <Button asChild variant="secondary" size="lg">
              <Link href="/login">{t("signIn")}</Link>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button asChild variant="glow" size="lg">
              <Link href="/signup">{t("startFree")}</Link>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
