"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Logo from "@/components/layout/Logo";
import { resolveActiveHref } from "@/components/layout/nav-config";
import { Button } from "@/core/ui/primitives/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/core/ui/primitives/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { key: "home", href: "/" },
  { key: "pricing", href: "/pricing" },
  { key: "appEngine", href: "/app" },
] as const;

/** Public marketing site's sticky nav: brand, primary links, locale/theme controls, and an App Engine CTA. */
export function Header() {
  const t = useTranslations("marketing.nav");
  const tShell = useTranslations("shell");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const activeHref = resolveActiveHref(
    pathname,
    NAV_ITEMS.map((item) => item.href),
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <Logo variant="mark" size={28} />
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            Pasargad <span className="text-muted-foreground">Engine</span>
          </span>
        </Link>

        <nav
          aria-label={tShell("navigation")}
          className="hidden flex-1 items-center justify-center gap-1 md:flex"
        >
          {NAV_ITEMS.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LocaleSwitcher className="hidden sm:flex" />
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/app">{t("appEngine")}</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label={tShell("openMenu")}
              >
                <Menu aria-hidden className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="end" className="flex w-72 flex-col">
              <SheetHeader>
                <SheetTitle>{tShell("navigation")}</SheetTitle>
              </SheetHeader>

              <nav aria-label={tShell("navigationDescription")} className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const active = item.href === activeHref;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {t(item.key)}
                    </Link>
                  );
                })}
              </nav>

              <Button asChild size="sm" onClick={() => setOpen(false)}>
                <Link href="/app">{t("appEngine")}</Link>
              </Button>

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
                <LocaleSwitcher />
                <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
