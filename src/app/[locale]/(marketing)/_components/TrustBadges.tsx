import { CalendarCheck, Lock, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

const BADGE_ICONS = [Lock, ShieldCheck, CalendarCheck] as const;
const BADGE_KEYS = ["dataIsolation", "securePayments", "noDoubleBooking"] as const;

/**
 * Plain-language technical guarantees (brief §4.5) — the same RLS/webhook/
 * trigger facts as `TrustBar`, but written for a non-technical visitor
 * instead of a reviewer reading the schema.
 */
export default async function TrustBadges() {
  const t = await getTranslations("marketing.socialProof");

  return (
    <div>
      <h3 className="font-serif text-lg font-semibold text-ink-primary">
        {t("trustBadgesTitle")}
      </h3>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {BADGE_KEYS.map((key, index) => {
          const Icon = BADGE_ICONS[index];
          return (
            <div
              key={key}
              className="rounded-interactive border border-subtle bg-surface p-5"
            >
              <Icon size={18} className="text-violet-dim" />
              <p className="mt-3 text-sm font-semibold text-ink-primary">
                {t(`trustBadges.${key}.title`)}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {t(`trustBadges.${key}.body`)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
