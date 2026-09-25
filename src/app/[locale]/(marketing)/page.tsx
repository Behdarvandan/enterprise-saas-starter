import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import DualCrew from "@/components/marketing/DualCrew";
import FinalCta from "@/components/marketing/FinalCta";
import Hero from "@/components/marketing/Hero";
import PricingSection from "@/components/marketing/PricingSection";
import RoiSection from "@/components/marketing/RoiSection";
import TrustStrip from "@/components/marketing/TrustStrip";
import WhatWeDo from "@/components/marketing/WhatWeDo";
import WhiteLabelSection from "@/components/marketing/WhiteLabelSection";
import { getAgencyContext } from "@/lib/agency/context";
import type { Locale } from "@/i18n/routing";

// Plan prices follow the visitor's geo-resolved region, so this page can't be
// prerendered.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  // On an agency's custom domain the layout's white-label title stays in charge.
  if (await getAgencyContext()) return {};

  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "marketing.landing.meta" });
  return { title: t("title"), description: t("description") };
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <WhatWeDo />
      <TrustStrip />
      <RoiSection />
      <DualCrew />
      <PricingSection />
      <WhiteLabelSection />
      <FinalCta />
    </>
  );
}
