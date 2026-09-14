export interface Plan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  priceId?: string;
  highlight?: boolean;
}

/**
 * Single source of truth for plan copy, shared by the homepage pricing
 * section and /pricing. `priceId` is read at request time from server env so
 * checkout always targets the configured Stripe price.
 */
export function getPlans(): Plan[] {
  return [
    {
      name: "Starter",
      price: "$0",
      description: "For a single organization getting its booking flow live.",
      features: ["1 organization", "Up to 3 members", "Community support"],
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "For teams running live scheduling and AI assist in production.",
      features: [
        "Unlimited members",
        "AI chatbot & knowledge base",
        "Priority support",
      ],
      priceId: process.env.STRIPE_PRICE_PRO,
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For organizations with dedicated security and support needs.",
      features: ["Everything in Pro", "SSO / SAML", "Dedicated support"],
      priceId: process.env.STRIPE_PRICE_ENTERPRISE,
    },
  ];
}
