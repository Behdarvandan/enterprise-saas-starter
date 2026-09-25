import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/core/ui/primitives/button";
import { LiquidButton } from "@/components/ui/liquid/LiquidButton";
import { LiquidCard } from "@/components/ui/liquid/LiquidCard";
import { AmbientGlow } from "@/components/ui/liquid/AmbientGlow";
import TrustStrip from "@/components/marketing/TrustStrip";
import FinalCta from "@/components/marketing/FinalCta";
import { getPortfolioItems } from "@/lib/portfolio";

export default async function CustomersPage() {
  const t = await getTranslations("marketing.customersPage");
  const portfolioItems = getPortfolioItems();

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
              <Link href="/signup">{t("ctaPrimary")}</Link>
            </Button>
            <LiquidButton asChild size="lg">
              <Link href="/solutions#quote">{t("ctaSecondary")}</Link>
            </LiquidButton>
          </div>
        </div>
      </section>

      <section className="animate-reveal-up border-y border-subtle bg-surface" style={{ animationDelay: "80ms" }}>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold text-ink-primary sm:text-3xl">
            {t("resultsTitle")}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {portfolioItems.map((item) => (
              <LiquidCard key={item.slug} interactive className="flex flex-col p-6">
                <h3 className="text-base font-semibold text-ink-primary">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{item.outcome}</p>
                <Link
                  href={`/solutions/portfolio/${item.slug}`}
                  className="mt-4 text-sm font-semibold text-ink-primary hover:text-primary"
                >
                  {t("resultsCta")} →
                </Link>
              </LiquidCard>
            ))}
          </div>
        </div>
      </section>

      <TrustStrip />
      <FinalCta />
    </div>
  );
}
