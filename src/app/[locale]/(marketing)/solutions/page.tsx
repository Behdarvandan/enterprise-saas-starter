import { Building2, Code2, Handshake } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/core/ui/primitives/button";
import { Card } from "@/core/ui/primitives/card";
import LeadForm from "../_components/LeadForm";
import { getPortfolioItems } from "@/lib/portfolio";

const SEGMENT_KEYS = ["enterprise", "agencies", "devTeams"] as const;
const SEGMENT_ICONS = { enterprise: Building2, agencies: Handshake, devTeams: Code2 };

export default async function SolutionsPage() {
  const t = await getTranslations("marketing.solutionsPage");
  const tNav = await getTranslations("marketing.megaNav");
  const portfolioItems = getPortfolioItems();

  return (
    <div>
      <section className="animate-reveal-up relative isolate overflow-hidden mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-medium leading-[1.1] tracking-tight text-ink-primary sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 text-lg text-ink-muted">{t("heroSubtitle")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="default" size="lg">
              <Link href="#quote">{t("ctaPrimary")}</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="#segments">{t("ctaSecondary")}</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            <Link href="/product" className="font-semibold text-ink-primary hover:text-primary">
              {t("bridgeLink")}
            </Link>
          </p>
        </div>
      </section>

      <section
        id="segments"
        className="animate-reveal-up border-y border-subtle bg-surface"
        style={{ animationDelay: "80ms" }}
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold text-ink-primary sm:text-3xl">
            {t("segmentsTitle")}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {SEGMENT_KEYS.map((key) => {
              const Icon = SEGMENT_ICONS[key];
              const bullets = t.raw(`segments.${key}.bullets`) as string[];
              return (
                <Card key={key} id={key} variant="item" className="scroll-mt-28 p-6">
                  <Icon size={20} className="text-primary" />
                  <h3 className="mt-4 text-base font-semibold text-ink-primary">
                    {tNav(`solutions.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {tNav(`solutions.${key}.description`)}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {bullets.map((bullet) => (
                      <li key={bullet} className="text-sm text-ink-muted">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </Card>
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
          <h2 className="font-display text-2xl font-semibold text-ink-primary sm:text-3xl">
            {t("portfolioTitle")}
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {portfolioItems.map((item) => (
            <Link
              key={item.slug}
              href={`/solutions/portfolio/${item.slug}`}
              className="block rounded-2xl border border-subtle bg-surface p-6 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10"
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
          <h2 className="font-display text-2xl font-semibold text-ink-primary sm:text-3xl">
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
