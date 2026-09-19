import { getTranslations } from "next-intl/server";
import Reveal from "@/components/marketing/Reveal";
import RoiCalculator from "@/components/marketing/RoiCalculator";
import SectionHeading from "@/components/marketing/SectionHeading";
import { getRoiPlanCosts } from "@/lib/marketing/pricing-view";

export default async function RoiSection() {
  const t = await getTranslations("marketing.landing.roi");

  return (
    <section id="roi" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <Reveal>
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      </Reveal>
      <Reveal className="mt-10">
        <RoiCalculator plans={getRoiPlanCosts()} />
      </Reveal>
    </section>
  );
}
