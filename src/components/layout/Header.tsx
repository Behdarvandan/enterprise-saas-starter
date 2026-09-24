import { getTranslations } from "next-intl/server";
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";
import Logo from "@/components/layout/Logo";
import MobileNav, { type MarketingNavLink } from "@/components/layout/MobileNav";
import { Button } from "@/core/ui/primitives/button";
import LiveDot from "@/components/ui/LiveDot";
import { Link } from "@/i18n/navigation";

/** Glassmorphism navbar of the public marketing surface. */
export default async function Header() {
  const t = await getTranslations("marketing.landing.nav");

  const links: MarketingNavLink[] = [
    { href: "/#capabilities", label: t("capabilities") },
    { href: "/#pricing", label: t("pricing") },
    { href: "/#agency", label: t("agency") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#0B0F17]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring/60">
            <Logo />
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 sm:inline-flex">
            <LiveDot />
            {t("agentOs")}
          </span>
        </div>

        <nav aria-label={t("primaryNav")} className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <LocaleSwitcher />
            <Button asChild variant="secondary">
              <Link href="/login">{t("signIn")}</Link>
            </Button>
            <Button asChild variant="glow">
              <Link href="/signup">{t("startFree")}</Link>
            </Button>
          </div>
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
