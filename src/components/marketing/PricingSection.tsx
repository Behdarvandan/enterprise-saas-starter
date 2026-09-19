import { getTranslations } from "next-intl/server";
import PricingMatrix from "@/components/marketing/PricingMatrix";
import Reveal from "@/components/marketing/Reveal";
import SectionHeading from "@/components/marketing/SectionHeading";
import { getPricingRegion } from "@/lib/geo";
import { buildPricingView } from "@/lib/marketing/pricing-view";

/** Prices are resolved per request from the visitor's region (see `getPricingRegion`). */
export default async function PricingSection() {
  const t = await getTranslations("marketing.landing.pricing");
  const { plans, skills } = buildPricingView(await getPricingRegion());

  return (
    <section id="pricing" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <Reveal>
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      </Reveal>
      <Reveal className="mt-14">
        <PricingMatrix plans={plans} skills={skills} />
      </Reveal>
    </section>
  );
}
