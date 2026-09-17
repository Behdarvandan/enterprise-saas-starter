import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getPlans } from "@/lib/plans";
import { getPricingRegion } from "@/lib/geo";

export default async function PricingSection() {
  const t = await getTranslations("marketing.pricingSection");
  const region = await getPricingRegion();
  const plans = getPlans(region);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold text-ink-primary sm:text-3xl">{t("title")}</h2>
        <p className="mt-3 text-ink-muted">{t("subtitle")}</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.tier}
            id={plan.tier === "enterprise" ? "enterprise" : undefined}
            className={`rounded-interactive border p-6 ${
              plan.highlight ? "border-violet-dim bg-surface-raised" : "border-subtle bg-surface"
            }`}
          >
            <h3 className="text-sm font-semibold text-ink-primary">{plan.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-ink-primary">{plan.price}</span>
              {plan.period && <span className="text-sm text-ink-muted">{plan.period}</span>}
            </div>
            <p className="mt-2 text-sm text-ink-muted">{plan.description}</p>
            <ul className="mt-5 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-ink-muted">
                  <Check size={14} className="shrink-0 text-status-success" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href="/pricing"
          className="text-sm font-semibold text-violet-dim hover:text-violet"
        >
          {t("compareLink")}
        </Link>
      </div>
    </section>
  );
}
