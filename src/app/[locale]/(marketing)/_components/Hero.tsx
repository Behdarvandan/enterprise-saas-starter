import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import BorderBeam from "@/components/ui/BorderBeam";
import DashboardPreview from "./DashboardPreview";

export default function Hero() {
  const t = useTranslations("marketing.hero");

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div
          className="animate-reveal-up"
          style={{ animationDelay: "0ms" }}
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary">
            {t("eyebrow")}
          </span>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-[1.1] tracking-tight text-ink-primary sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p
            className="mt-5 animate-reveal-up text-lg text-ink-muted"
            style={{ animationDelay: "80ms" }}
          >
            {t("subtitle")}
          </p>

          <div
            className="mt-8 flex flex-wrap items-center gap-3 animate-reveal-up"
            style={{ animationDelay: "160ms" }}
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-interactive bg-violet px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-violet/90"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/pricing#enterprise"
              className="inline-flex items-center gap-2 rounded-interactive border border-subtle px-5 py-2.5 text-sm font-semibold text-ink-primary transition-colors hover:border-violet-dim/60"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>

        <div className="animate-reveal-up" style={{ animationDelay: "220ms" }}>
          <BorderBeam>
            <DashboardPreview />
          </BorderBeam>
        </div>
      </div>
    </section>
  );
}
