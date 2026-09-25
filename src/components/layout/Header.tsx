import { getTranslations } from "next-intl/server";
import Logo from "@/components/layout/Logo";
import MobileNav, { type MarketingNavLink } from "@/components/layout/MobileNav";
import { Button } from "@/core/ui/primitives/button";
import { LiquidButton } from "@/components/ui/liquid/LiquidButton";
import { ThemeToggle } from "@/components/ui/liquid/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/liquid/LanguageSwitcher";
import LiveDot from "@/components/ui/LiveDot";
import { Link } from "@/i18n/navigation";

/** Liquid Glass navbar of the public marketing surface. */
export default async function Header() {
  const t = await getTranslations("marketing.landing.nav");

  const links: MarketingNavLink[] = [
    { href: "/#capabilities", label: t("capabilities") },
    { href: "/#pricing", label: t("pricing") },
    { href: "/#agency", label: t("agency") },
  ];

  return (
    <header className="liquid-surface sticky top-0 z-50 w-full rounded-none">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring/60">
            <Logo />
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:inline-flex">
            <LiveDot />
            {t("agentOs")}
          </span>
        </div>

        <nav aria-label={t("primaryNav")} className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <LanguageSwitcher />
            <ThemeToggle />
            <LiquidButton asChild size="sm">
              <Link href="/login">{t("signIn")}</Link>
            </LiquidButton>
            <Button asChild variant="glow" size="sm">
              <Link href="/signup">{t("startFree")}</Link>
            </Button>
          </div>
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
