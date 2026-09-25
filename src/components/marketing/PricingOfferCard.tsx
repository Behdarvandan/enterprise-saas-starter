"use client";

import { useState, type CSSProperties } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { LiquidCard } from "@/components/ui/liquid/LiquidCard";
// Imported directly (not via @/modules/billing's barrel) because this is a
// Client Component: the barrel also re-exports the webhook helpers in
// lemonsqueezy.ts, which reach into next/headers via the admin DB client —
// pulling that into a client bundle breaks the build.
import { LemonSqueezyCheckoutButton } from "@/modules/billing/components/LemonSqueezyCheckoutButton";
import { cn } from "@/lib/utils";

type Interval = "monthly" | "yearly";

/** Matches the toggle track's actual geometry (34px track, 20px thumb, 2px inset). */
const TOGGLE_STYLE = { "--toggle-travel": "10px" } as CSSProperties;

/**
 * The single self-serve offer: $300 one-time setup fee (configured on the
 * Lemon Squeezy variant itself, not in this component) + 14-day free trial,
 * then monthly/yearly billing via `createLemonSqueezyCheckoutAction`.
 */
export function PricingOfferCard() {
  const t = useTranslations("pricing.offer");
  const [interval, setInterval] = useState<Interval>("monthly");
  const isYearly = interval === "yearly";
  const features = t.raw("features") as string[];

  return (
    <LiquidCard className="mx-auto max-w-lg p-8 text-center sm:p-10">
      <h1 className="text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 text-pretty text-base text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-8 flex items-center justify-center gap-3">
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            !isYearly ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {t("monthly")}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isYearly}
          aria-label={t("yearly")}
          data-on={isYearly}
          style={TOGGLE_STYLE}
          className="t-toggle relative h-7 w-[34px] shrink-0 rounded-full border border-border bg-secondary outline-none focus-visible:ring-2 focus-visible:ring-ring/60 data-[on=true]:bg-primary"
          onClick={(event) => {
            event.currentTarget.classList.add("is-init");
            setInterval(isYearly ? "monthly" : "yearly");
          }}
        >
          <span className="t-toggle-thumb absolute top-0.5 start-0.5 size-5 rounded-full bg-white shadow" />
        </button>
        <span
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium transition-colors",
            isYearly ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {t("yearly")}
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {t("yearlyBadge")}
          </span>
        </span>
      </div>

      <ul className="mt-8 space-y-2.5 text-start">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <LemonSqueezyCheckoutButton interval={interval} label={isYearly ? t("ctaYearly") : t("ctaMonthly")} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t("setupFeeNote")}</p>
    </LiquidCard>
  );
}
