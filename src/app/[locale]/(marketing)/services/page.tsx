import { Check, Code2, CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/core/ui/primitives/button";
import LeadForm from "../_components/LeadForm";
import { getPortfolioItems } from "@/lib/portfolio";

const CATEGORY_KEYS = [
  "fullstackSaas",
  "aiAutomation",
  "architectureSecurity",
  "paymentSubscription",
] as const;

const CATEGORY_ICONS = [Code2, Sparkles, ShieldCheck, CreditCard] as const;

export default async function ServicesPage() {
  const t = await getTranslations("marketing.servicesPage");
  const portfolioItems = getPortfolioItems();

  return (
    <div>
      <section className="animate-reveal-up mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl font-medium leading-[1.1] tracking-tight text-ink-primary sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 text-lg text-ink-muted">{t("heroSubtitle")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="#quote">{t("ctaPrimary")}</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="#categories">{t("ctaSecondary")}</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            <Link href="/saas" className="font-semibold text-ink-primary hover:text-primary">
              {t("bridgeLink")}
            </Link>
          </p>
        </div>
      </section>

      <section
        id="categories"
        className="animate-reveal-up border-y border-subtle bg-surface"
        style={{ animationDelay: "80ms" }}
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-semibold text-ink-primary sm:text-3xl">
            {t("categoriesTitle")}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {CATEGORY_KEYS.map((key, index) => {
              const Icon = CATEGORY_ICONS[index];
              const bullets = t.raw(`categories.${key}.bullets`) as string[];
              return (
                <div
                  key={key}
                  className="rounded-interactive border border-subtle bg-canvas p-6 transition-[transform,box-shadow,border-color] duration-200 hover:scale-[1.01] hover:border-primary/50 hover:shadow-md hover:shadow-primary/10"
                >
                  <Icon size={20} className="text-primary" />
                  <h3 className="mt-4 text-base font-semibold text-ink-primary">
                    {t(`categories.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {t(`categories.${key}.description`)}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2 text-sm text-ink-muted"
                      >
                        <Check size={14} className="mt-0.5 shrink-0 text-status-success" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="animate-reveal-up mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        style={{ animationDelay: "140ms" }}
      >
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl font-semibold text-ink-primary sm:text-3xl">
            {t("portfolioTitle")}
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {portfolioItems.map((item) => (
            <Link
              key={item.slug}
              href={`/services/portfolio/${item.slug}`}
              className="rounded-interactive border border-subtle bg-surface p-6 transition-[transform,box-shadow,border-color] duration-200 hover:scale-[1.01] hover:border-primary/50 hover:shadow-md hover:shadow-primary/10"
            >
              <h3 className="text-base font-semibold text-ink-primary">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {item.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-control bg-surface-raised px-2 py-0.5 text-xs font-medium text-ink-muted"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section
        id="quote"
        className="animate-reveal-up border-t border-subtle bg-surface"
        style={{ animationDelay: "200ms" }}
      >
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-semibold text-ink-primary sm:text-3xl">
            {t("formTitle")}
          </h2>
          <p className="mt-3 text-ink-muted">{t("formSubtitle")}</p>
          <div className="mt-8">
            <LeadForm />
          </div>
        </div>
      </section>
    </div>
  );
}
