import { Check } from "lucide-react";
import LegacyCard from "@/components/ui/LegacyCard";
import CheckoutButton from "@/components/billing/CheckoutButton";
import { getPlans } from "@/lib/plans";

// Read server env vars at request time so plan prices stay in sync with the
// configured Stripe price IDs (never exposed to the client).
export const dynamic = "force-dynamic";

export default function PricingPage() {
  const plans = getPlans();

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-ink-primary sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          Start free and upgrade when your team is ready.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <LegacyCard
            key={plan.name}
            id={plan.name === "Enterprise" ? "enterprise" : undefined}
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
                {plan.priceId ? (
                  <CheckoutButton priceId={plan.priceId} label={`Get ${plan.name}`} />
                ) : (
                  <p className="text-center text-sm font-semibold text-ink-muted">
                    Current plan
                  </p>
                )}
              </div>
            </div>
          </LegacyCard>
        ))}
      </div>
    </div>
  );
}
