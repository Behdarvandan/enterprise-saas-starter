import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import CheckoutButton from "@/components/billing/CheckoutButton";
import { getPlans } from "@/lib/plans";
import { getPricingRegion } from "@/lib/geo";

// Read server env vars/geo headers at request time so plan prices stay in
// sync with the visitor's region and the configured Stripe price IDs.
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const region = await getPricingRegion();
  const plans = getPlans(region);

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          Straightforward monthly plans, priced for your region.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.tier}
            id={plan.tier === "enterprise" ? "enterprise" : undefined}
            variant="item"
            className={plan.highlight ? "border-violet-dim" : undefined}
          >
            <div className="p-6">
              <h2 className="text-lg font-semibold text-ink-primary">{plan.name}</h2>
              <p className="mt-1 text-sm text-ink-muted">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-ink-primary">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-ink-muted">{plan.period}</span>
                )}
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-ink-muted">
                    <Check size={16} className="text-status-success" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {plan.tier === "enterprise" || plan.checkout.kind === "contact" ? (
                  <a
                    href={plan.checkout.kind === "contact" ? plan.checkout.href : "/services#quote"}
                    className="block rounded-interactive border border-subtle px-4 py-2 text-center text-sm font-semibold text-ink-primary transition-colors hover:border-gold/50"
                  >
                    Contact sales
                  </a>
                ) : (
                  <CheckoutButton tier={plan.tier} label={`Get ${plan.name}`} />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
