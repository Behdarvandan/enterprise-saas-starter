import { getTranslations } from "next-intl/server";
import { Button } from "@/core/ui/primitives/button";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/layout/Logo";

const FOOTER_LINKS = [
  { key: "home", href: "/" },
  { key: "pricing", href: "/pricing" },
  { key: "appEngine", href: "/app" },
] as const;

export async function ConversionBanner() {
  const t = await getTranslations("marketing.home");
  const nav = await getTranslations("marketing.nav");
  const shell = await getTranslations("shell");
  const year = new Date().getFullYear();

  return (
    <section className="border-t border-border">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center sm:py-20">
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {t("cta.title")}
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">{t("cta.subtitle")}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/app">{t("hero.ctaPrimary")}</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/pricing">{t("hero.ctaSecondary")}</Link>
          </Button>
        </div>
      </div>

      <div className="border-t border-border bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Logo variant="mark" size={20} />
            <span className="text-sm text-muted-foreground">{t("cta.footerTagline")}</span>
          </div>

          <nav aria-label={shell("navigation")} className="flex items-center gap-4">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {nav(link.key)}
              </Link>
            ))}
          </nav>

          <p className="text-xs text-muted-foreground">
            {t("cta.footerCopyright", { year })}
          </p>
        </div>
      </div>
    </section>
  );
}
