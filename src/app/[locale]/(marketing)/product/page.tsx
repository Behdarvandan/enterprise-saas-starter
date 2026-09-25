import { Bot, Building2, Palette, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/core/ui/primitives/button";
import { Card } from "@/core/ui/primitives/card";
import { getPlans } from "@/lib/plans";
import { getPricingRegion } from "@/lib/geo";

// Reads the visitor's geo-resolved region and region-specific Stripe price
// ids (via getPlans()) at request time, same reason as /pricing: plan
// pricing must stay in sync with the visitor's region, never statically
// baked into the build.
export const dynamic = "force-dynamic";

const MODULE_KEYS = ["digitalWorkforce", "knowledgeBase", "multiCompany", "whiteLabelPortal"] as const;
const MODULE_ICONS = { digitalWorkforce: Bot, knowledgeBase: Search, multiCompany: Building2, whiteLabelPortal: Palette };

export default async function ProductPage() {
  const t = await getTranslations("marketing.productPage");
  const tNav = await getTranslations("marketing.megaNav");
  const region = await getPricingRegion();
  const plans = getPlans(region);

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
              <Link href="/signup">{t("ctaPrimary")}</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/pricing">{t("ctaSecondary")}</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            <Link href="/solutions" className="font-semibold text-ink-primary hover:text-primary">
              {t("bridgeLink")}
            </Link>
          </p>
        </div>
      </section>

      <section className="animate-reveal-up border-y border-subtle bg-surface" style={{ animationDelay: "80ms" }}>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold text-ink-primary sm:text-3xl">
            {t("modulesTitle")}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {MODULE_KEYS.map((key) => {
              const Icon = MODULE_ICONS[key];
              const bullets = t.raw(`modules.${key}.bullets`) as string[];
              return (
                <Card key={key} id={key} variant="item" className="scroll-mt-28 p-6">
                  <Icon size={20} className="text-primary" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {tNav(`products.${key}.tag`)}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-ink-primary">
                    {tNav(`products.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {tNav(`products.${key}.description`)}
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
        <h2 className="font-display text-2xl font-semibold text-ink-primary sm:text-3xl">
          {t("pricingTitle")}
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              variant="item"
              className={plan.highlight ? "border-primary/50 p-6" : "p-6"}
            >
              <h3 className="text-sm font-semibold text-ink-primary">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-ink-primary">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-ink-muted">{plan.period}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-ink-muted">{plan.description}</p>
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/pricing" className="text-sm font-semibold text-ink-primary hover:text-primary">
            {t("pricingCta")} →
          </Link>
        </div>
      </section>
    </div>
  );
}
