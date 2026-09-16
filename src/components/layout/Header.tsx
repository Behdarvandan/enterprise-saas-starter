import { Boxes } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ThemeToggle from "@/components/theme-toggle";
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";

export default async function Header() {
  const t = await getTranslations("marketing.header");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-subtle bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-ink-primary"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-control bg-violet text-white">
            <Boxes size={17} />
          </div>
          <span>Nimbus</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-ink-muted">
          <Link href="/#platform" className="transition-colors hover:text-ink-primary">
            {t("platform")}
          </Link>
          <Link href="/#security" className="transition-colors hover:text-ink-primary">
            {t("security")}
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-ink-primary">
            {t("pricing")}
          </Link>
          <Link href="/login" className="transition-colors hover:text-ink-primary">
            {t("signIn")}
          </Link>
          <LocaleSwitcher />
          <ThemeToggle />
          <Link
            href="/signup"
            className="rounded-interactive bg-violet px-4 py-2 font-semibold text-white transition-colors hover:bg-violet/90"
          >
            {t("startTrial")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
