import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getPlans } from "@/lib/plans";

// Reads STRIPE_PRICE_PRO/_ENTERPRISE (via getPlans()) at request time, same
// reason as /pricing: plan pricing must stay in sync with the configured
// Stripe price id, never statically baked into the build.
export const dynamic = "force-dynamic";

export default async function SaasPage() {
  const t = await getTranslations("marketing.saasPage");
  const plans = getPlans();

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
              <Link href="#features">{t("ctaPrimary")}</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/pricing">{t("ctaSecondary")}</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            <Link href="/services" className="font-semibold text-ink-primary hover:text-primary">
              {t("bridgeLink")}
            </Link>
          </p>
        </div>
      </section>

      <section
        id="features"
        className="animate-reveal-up border-y border-subtle bg-surface"
        style={{ animationDelay: "80ms" }}
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-semibold text-ink-primary sm:text-3xl">
            {t("featuresTitle")}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              t("features.multiTenant"),
              t("features.payments"),
              t("features.rag"),
              t("features.rls"),
              t("features.i18n"),
              t("features.observability"),
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-3 rounded-interactive border border-subtle bg-canvas p-5 transition-[transform,box-shadow,border-color] duration-200 hover:scale-[1.01] hover:border-gold/50 hover:shadow-md hover:shadow-gold/10"
              >
                <Check size={18} className="mt-0.5 shrink-0 text-status-success" />
                <p className="text-sm text-ink-muted">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="animate-reveal-up mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        style={{ animationDelay: "140ms" }}
      >
        <h2 className="font-serif text-2xl font-semibold text-ink-primary sm:text-3xl">
          {t("pricingTitle")}
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-interactive border p-6 transition-[transform,box-shadow,border-color] duration-200 hover:scale-[1.01] hover:shadow-md hover:shadow-gold/10 ${
                plan.highlight
                  ? "border-gold/60 bg-surface-raised"
                  : "border-subtle bg-surface hover:border-gold/50"
              }`}
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
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/pricing" className="text-sm font-semibold text-ink-primary hover:text-primary">
            {t("ctaSecondary")} →
          </Link>
        </div>
      </section>
    </div>
  );
}
