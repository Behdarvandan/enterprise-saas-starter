import { getTranslations } from "next-intl/server";
import Logo from "@/components/layout/Logo";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/core/ui/primitives/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/core/ui/primitives/navigation-menu";
import { LanguageSwitcher } from "@/components/ui/liquid/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/liquid/ThemeToggle";
import { Link } from "@/i18n/navigation";

const PRODUCT_KEYS = ["digitalWorkforce", "knowledgeBase", "multiCompany", "whiteLabelPortal"] as const;
const SOLUTION_KEYS = ["enterprise", "agencies", "devTeams"] as const;

/**
 * Payhawk-style floating capsule nav for the public marketing surface.
 * Intentionally theme-invariant (bg-neutral-950/80 regardless of light/dark
 * mode) — a deliberate dark-glass marketing-chrome pattern, not a bug to
 * "fix" toward the adaptive .liquid-surface treatment used elsewhere.
 */
export default async function Header() {
  const t = await getTranslations("marketing.megaNav");
  const tNav = await getTranslations("marketing.landing.nav");

  return (
    <header className="fixed left-1/2 top-6 z-50 w-[92%] max-w-7xl -translate-x-1/2 rounded-full border border-white/10 bg-neutral-950/80 px-8 py-3.5 shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring/60">
          <Logo iconless />
        </Link>

        <NavigationMenu viewport className="hidden lg:flex" delayDuration={100}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>{t("productsEyebrow")}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[min(90vw,56rem)] grid-cols-4 gap-2 p-4">
                  {PRODUCT_KEYS.map((key) => (
                    <li key={key}>
                      <NavigationMenuLink asChild>
                        <Link href={`/product#${key}`}>
                          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            {t(`products.${key}.tag`)}
                          </span>
                          <span className="font-semibold text-white">{t(`products.${key}.title`)}</span>
                          <span className="text-slate-400">{t(`products.${key}.description`)}</span>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>{t("solutionsEyebrow")}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[min(90vw,42rem)] grid-cols-3 gap-2 p-4">
                  {SOLUTION_KEYS.map((key) => (
                    <li key={key}>
                      <NavigationMenuLink asChild>
                        <Link href={`/solutions#${key}`}>
                          <span className="font-semibold text-white">{t(`solutions.${key}.title`)}</span>
                          <span className="text-slate-400">{t(`solutions.${key}.description`)}</span>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/customers"
                  className="inline-flex h-9 items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-300 outline-none transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  {t("customers")}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/resources"
                  className="inline-flex h-9 items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-300 outline-none transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  {t("resources")}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/pricing"
                  className="inline-flex h-9 items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-300 outline-none transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  {t("pricing")}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              href="/login"
              className="px-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              {tNav("signIn")}
            </Link>
            <Button asChild variant="glow" size="sm">
              <Link href="/services#quote">{t("requestDemo")}</Link>
            </Button>
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
