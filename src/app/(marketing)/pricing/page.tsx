import { Check } from "lucide-react";
import Card from "@/components/ui/Card";
import CheckoutButton from "@/components/billing/CheckoutButton";

// Read server env vars at request time so plan prices stay in sync with the
// configured Stripe price IDs (never exposed to the client).
export const dynamic = "force-dynamic";

interface Plan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  priceId?: string;
  highlight?: boolean;
}

const plans: Plan[] = [
  {
    name: "Starter",
    price: "$0",
    description: "For individuals exploring the product.",
    features: ["1 organization", "Up to 3 members", "Community support"],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For growing teams that need more power.",
    features: ["Unlimited members", "Priority support", "Advanced analytics"],
    priceId: process.env.STRIPE_PRICE_PRO,
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    description: "For larger organizations with advanced needs.",
    features: ["Everything in Pro", "SSO / SAML", "Dedicated support"],
    priceId: process.env.STRIPE_PRICE_ENTERPRISE,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-slate-500">
          Start free and upgrade when your team is ready.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.highlight ? "border-brand-500 shadow-lg" : "p-6"}
          >
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                {plan.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-slate-900">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-slate-500">{plan.period}</span>
                )}
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-slate-600"
                  >
                    <Check size={16} className="text-brand-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {plan.priceId ? (
                  <CheckoutButton
                    priceId={plan.priceId}
                    label={`Get ${plan.name}`}
                  />
                ) : (
                  <p className="text-center text-sm font-semibold text-slate-400">
                    Current plan
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
