import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/core/ui/primitives/button";
import { LiquidButton } from "@/components/ui/liquid/LiquidButton";
import { LiquidCard } from "@/components/ui/liquid/LiquidCard";
import { AmbientGlow } from "@/components/ui/liquid/AmbientGlow";
import { getPlans } from "@/lib/plans";
import { getPricingRegion } from "@/lib/geo";

// Reads the visitor's geo-resolved region and region-specific Stripe price
// ids (via getPlans()) at request time, same reason as /pricing: plan
// pricing must stay in sync with the visitor's region, never statically
// baked into the build.
export const dynamic = "force-dynamic";

export default async function SaasPage() {
  const t = await getTranslations("marketing.saasPage");
  const region = await getPricingRegion();
  const plans = getPlans(region);

  return (
    <div>
      <section className="animate-reveal-up relative isolate overflow-hidden mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <AmbientGlow position="top" />
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-medium leading-[1.1] tracking-tight text-ink-primary sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 text-lg text-ink-muted">{t("heroSubtitle")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="glow" size="lg">
              <Link href="#features">{t("ctaPrimary")}</Link>
            </Button>
            <LiquidButton asChild size="lg">
              <Link href="/pricing">{t("ctaSecondary")}</Link>
            </LiquidButton>
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
          <h2 className="font-display text-2xl font-semibold text-ink-primary sm:text-3xl">
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
              <LiquidCard key={feature} interactive className="flex items-start gap-3 p-5">
                <Check size={18} className="mt-0.5 shrink-0 text-status-success" />
                <p className="text-sm text-ink-muted">{feature}</p>
              </LiquidCard>
            ))}
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
            <LiquidCard
              key={plan.name}
              interactive
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
            </LiquidCard>
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
