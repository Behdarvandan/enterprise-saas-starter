import { formatPlanPrice } from "@/lib/utils";
import type { PricingRegion } from "@/lib/geo";

export type PlanTier = "starter" | "pro" | "enterprise";

export type PlanCheckout =
  | { kind: "stripe"; priceId: string; amount: number; currency: "EUR" | "USD" }
  | { kind: "paytr"; amount: number; currency: "TRY" }
  | { kind: "contact"; href: string };

export interface Plan {
  tier: PlanTier;
  region: PricingRegion;
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  highlight?: boolean;
  checkout: PlanCheckout;
}

/**
 * Country-isolated B2B pricing — one region's plans only, never all regions
 * at once (no manual currency switcher exists anywhere in the app; the
 * visitor's region is resolved server-side via `getPricingRegion()` and this
 * is the only plan set they're shown). `amount` is always the server-side
 * source of truth for checkout (see `/api/checkout`) — display strings are
 * derived from it via `formatPlanPrice`, never hand-typed separately.
 */
export function getPlans(region: PricingRegion): Plan[] {
  if (region === "tr") {
    return [
      {
        tier: "starter",
        region,
        name: "Starter",
        price: formatPlanPrice(149_900, "TRY"),
        period: "/ay",
        description: "Tek şube için otonom AI asistanı ve randevu altyapısı.",
        features: [
          "Aylık 500 AI Müşteri Görüşmesi",
          "100 Canlı Randevu/Servis Kaydı",
          "1 Bilgi Tabanı Dokümanı (PDF/Fiyat Listesi)",
          "7/24 Otonom Asistan",
        ],
        checkout: { kind: "paytr", amount: 149_900, currency: "TRY" },
      },
      {
        tier: "pro",
        region,
        name: "Pro",
        price: formatPlanPrice(399_900, "TRY"),
        period: "/ay",
        description: "Büyüyen işletmeler için sınırsız randevu ve öncelikli destek.",
        features: [
          "Aylık 3.000 AI Müşteri Görüşmesi",
          "Sınırsız Servis/Randevu Kaydı",
          "5 Bilgi Tabanı Dokümanı",
          "Özel WhatsApp Entegrasyonu",
          "Öncelikli Destek",
        ],
        highlight: true,
        checkout: { kind: "paytr", amount: 399_900, currency: "TRY" },
      },
      enterprisePlan(region, "Özel Teklif Alın"),
    ];
  }

  if (region === "eu") {
    return [
      {
        tier: "starter",
        region,
        name: "Starter",
        price: formatPlanPrice(4_900, "EUR"),
        period: "/month",
        description: "Autonomous AI assistant and booking infrastructure for a single location.",
        features: [
          "500 AI customer conversations / month",
          "100 live bookings/service records",
          "1 knowledge base document (PDF/price list)",
          "24/7 autonomous assistant",
        ],
        checkout: {
          kind: "stripe",
          priceId: process.env.STRIPE_PRICE_STARTER_EUR ?? "",
          amount: 4_900,
          currency: "EUR",
        },
      },
      {
        tier: "pro",
        region,
        name: "Pro",
        price: formatPlanPrice(14_900, "EUR"),
        period: "/month",
        description: "For growing businesses running unlimited bookings with priority support.",
        features: [
          "3,000 AI customer conversations / month",
          "Unlimited service/booking records",
          "5 knowledge base documents",
          "Dedicated WhatsApp integration",
          "Priority support",
        ],
        highlight: true,
        checkout: {
          kind: "stripe",
          priceId: process.env.STRIPE_PRICE_PRO_EUR ?? "",
          amount: 14_900,
          currency: "EUR",
        },
      },
      enterprisePlan(region, "Custom Quote"),
    ];
  }

  return [
    {
      tier: "starter",
      region,
      name: "Starter",
      price: formatPlanPrice(2_000, "USD"),
      period: "/month",
      description: "Autonomous AI assistant and booking infrastructure for a single location.",
      features: [
        "500 AI customer conversations / month",
        "100 live bookings/service records",
        "1 knowledge base document (PDF/price list)",
        "24/7 autonomous assistant",
      ],
      checkout: {
        kind: "stripe",
        priceId: process.env.STRIPE_PRICE_STARTER_USD ?? "",
        amount: 2_000,
        currency: "USD",
      },
    },
    {
      tier: "pro",
      region,
      name: "Pro",
      price: formatPlanPrice(5_000, "USD"),
      period: "/month",
      description: "For growing businesses running unlimited bookings with priority support.",
      features: [
        "3,000 AI customer conversations / month",
        "Unlimited service/booking records",
        "5 knowledge base documents",
        "Dedicated WhatsApp integration",
        "Priority support",
      ],
      highlight: true,
      checkout: {
        kind: "stripe",
        priceId: process.env.STRIPE_PRICE_PRO_USD ?? "",
        amount: 5_000,
        currency: "USD",
      },
    },
    enterprisePlan(region, "Custom Quote"),
  ];
}

function enterprisePlan(region: PricingRegion, priceLabel: string): Plan {
  return {
    tier: "enterprise",
    region,
    name: "Enterprise",
    price: priceLabel,
    description: "Çoklu şube ve özel entegrasyon ihtiyacı olan işletmeler için.",
    features: [
      "Sınırsız AI Görüşmesi & Randevu",
      "Çoklu Şube Desteği",
      "Özel ERP/CRM API Entegrasyonu",
      "Dedicated Sunucu & Özel Müşteri Yöneticisi",
    ],
    checkout: { kind: "contact", href: "/services#quote" },
  };
}

/** Flattened plan list across all regions, for cross-region lookups (e.g. admin analytics). */
export function getAllPlans(): Plan[] {
  return [...getPlans("tr"), ...getPlans("eu"), ...getPlans("global")];
}
