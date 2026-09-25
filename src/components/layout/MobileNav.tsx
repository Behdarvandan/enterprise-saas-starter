"use client";

import { ChevronDown, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import Logo from "@/components/layout/Logo";
import { Button } from "@/core/ui/primitives/button";
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/core/ui/primitives/sheet";
import { Link } from "@/i18n/navigation";

const PRODUCT_KEYS = ["digitalWorkforce", "knowledgeBase", "multiCompany", "whiteLabelPortal"] as const;
const SOLUTION_KEYS = ["enterprise", "agencies", "devTeams"] as const;

/** Hamburger drawer for the marketing header below the `lg` breakpoint. */
export default function MobileNav() {
  const t = useTranslations("marketing.megaNav");
  const tNav = useTranslations("marketing.landing.nav");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden text-slate-300 hover:bg-white/5 hover:text-white" aria-label={tNav("openMenu")}>
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="end" variant="default" className="border-white/10 bg-neutral-950 text-white sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="text-white">
            <Logo iconless />
          </SheetTitle>
        </SheetHeader>

        <nav aria-label={tNav("menuTitle")} className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto">
          <details className="group rounded-lg">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-white transition-colors hover:bg-white/5">
              {t("productsEyebrow")}
              <ChevronDown aria-hidden className="size-4 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid gap-1 py-1 ps-3">
              {PRODUCT_KEYS.map((key) => (
                <SheetClose asChild key={key}>
                  <Link
                    href={`/product#${key}`}
                    className="flex min-h-11 flex-col justify-center rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {t(`products.${key}.title`)}
                  </Link>
                </SheetClose>
              ))}
            </div>
          </details>

          <details className="group rounded-lg">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-white transition-colors hover:bg-white/5">
              {t("solutionsEyebrow")}
              <ChevronDown aria-hidden className="size-4 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid gap-1 py-1 ps-3">
              {SOLUTION_KEYS.map((key) => (
                <SheetClose asChild key={key}>
                  <Link
                    href={`/solutions#${key}`}
                    className="flex min-h-11 flex-col justify-center rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {t(`solutions.${key}.title`)}
                  </Link>
                </SheetClose>
              ))}
            </div>
          </details>

          {[
            { href: "/customers", label: t("customers") },
            { href: "/resources", label: t("resources") },
            { href: "/pricing", label: t("pricing") },
          ].map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="flex min-h-11 items-center rounded-lg px-3 py-3 text-base font-medium text-white transition-colors hover:bg-white/5"
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>

        <div className="mt-auto grid gap-3">
          <div className="flex items-center gap-2">
            <LocaleSwitcher className="flex-1 justify-center" />
            <ThemeToggle />
          </div>
          <SheetClose asChild>
            <Button asChild variant="secondary" size="lg">
              <Link href="/login">{tNav("signIn")}</Link>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button asChild variant="default" size="lg">
              <Link href="/solutions#quote">{t("requestDemo")}</Link>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
