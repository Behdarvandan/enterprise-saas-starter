export const dynamic = "force-dynamic";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Hero from "./_components/Hero";
import TrustBar from "./_components/TrustBar";
import PersonaSection from "./_components/PersonaSection";
import FeatureDepth from "./_components/FeatureDepth";
import SecuritySection from "./_components/SecuritySection";
import SocialProof from "./_components/SocialProof";
import PricingSection from "./_components/PricingSection";

export default async function HomePage() {
  const t = await getTranslations("marketing.homeCta");

  return (
    <div>
      <Hero />
      <TrustBar />
      <PersonaSection />
      <FeatureDepth />
      <SecuritySection />
      <SocialProof />
      <PricingSection />

      <section className="border-t border-subtle bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-16 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <h2 className="text-xl font-semibold text-ink-primary">{t("title")}</h2>
            <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-interactive bg-violet px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet/90"
          >
            {t("button")}
          </Link>
        </div>
      </section>
    </div>
  );
}
