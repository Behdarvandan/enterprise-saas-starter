import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LanguageSelector from "@/components/language-selector";
import ThemeToggle from "@/components/theme-toggle";
import Logo from "@/components/layout/Logo";

export default async function Header() {
  const t = await getTranslations("marketing.header");

  return (
    <header className="liquid-glass sticky top-0 z-50 w-full">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-zinc-400">
          <Link href="/#platform" className="transition-colors hover:text-zinc-100">
            {t("features")}
          </Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-zinc-100">
            {t("howItWorks")}
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-zinc-100">
            {t("pricing")}
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LanguageSelector />
          <Link href="/login" className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100">
            {t("signIn")}
          </Link>
          <Link
            href="/signup"
            className="rounded-interactive bg-violet px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-violet/90"
          >
            {t("startTrial")}
          </Link>
        </div>
      </div>
    </header>
  );
}
