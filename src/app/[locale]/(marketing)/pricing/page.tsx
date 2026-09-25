import { getTranslations } from "next-intl/server";
import { PricingOfferCard } from "@/components/marketing/PricingOfferCard";
import PricingMatrix from "@/components/marketing/PricingMatrix";
import Reveal from "@/components/marketing/Reveal";
import RoiCalculator from "@/components/marketing/RoiCalculator";
import { buildPricingView, getRoiPlanCosts } from "@/lib/marketing/pricing-view";
import { getPricingRegion } from "@/lib/geo";

// Plan prices and the ROI calculator's baseline follow the visitor's
// geo-resolved region, so this page can't be prerendered.
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const t = await getTranslations("pricing.offer");
  const region = await getPricingRegion();
  const { plans, skills } = buildPricingView(region);

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <PricingOfferCard />
      </Reveal>

      <Reveal delay={80} className="mt-20">
        <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("calculatorTitle")}
        </h2>
        <div className="mt-8">
          <RoiCalculator plans={getRoiPlanCosts()} />
        </div>
      </Reveal>

      <Reveal delay={120} className="mt-20">
        <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("matrixTitle")}
        </h2>
        <div className="mt-8">
          <PricingMatrix plans={plans} skills={skills} />
        </div>
      </Reveal>
    </div>
  );
}
