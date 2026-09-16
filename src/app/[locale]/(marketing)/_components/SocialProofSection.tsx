import { getTranslations } from "next-intl/server";
import TrustBadges from "./TrustBadges";

const STEP_KEYS = ["meeting", "setup", "delivery"] as const;

/**
 * Placeholder mode (brief §4.5): no real client references exist yet, so
 * this renders `<TrustBadges>` + a 3-step "Nasıl Çalışırız" strip instead
 * of fabricated testimonials or empty logo slots. Swappable to real
 * logos/case studies later without a structural rewrite — replace the
 * content below, keep the section shell.
 */
export default async function SocialProofSection() {
  const t = await getTranslations("marketing.socialProof");

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <TrustBadges />

      <div className="mt-16">
        <h3 className="font-serif text-lg font-semibold text-ink-primary">
          {t("howWeWorkTitle")}
        </h3>
        <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden border border-subtle bg-subtle sm:grid-cols-3">
          {STEP_KEYS.map((key) => (
            <div key={key} className="bg-canvas p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {t(`howWeWork.${key}.step`)}
              </p>
              <h4 className="mt-2 text-base font-semibold text-ink-primary">
                {t(`howWeWork.${key}.title`)}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {t(`howWeWork.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
