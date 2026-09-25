"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { createLemonSqueezyCheckoutAction } from "@/modules/billing/actions";
import { LiquidButton } from "@/components/ui/liquid/LiquidButton";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface LemonSqueezyCheckoutButtonProps {
  interval: "monthly" | "yearly";
  label: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Redirects to a Lemon Squeezy hosted checkout for the given billing
 * interval. Mirrors `src/components/billing/CheckoutButton.tsx`'s
 * loading/redirect pattern, calling the Server Action directly instead of
 * `fetch`-ing a route handler.
 */
export function LemonSqueezyCheckoutButton({
  interval,
  label,
  className,
  size = "lg",
}: LemonSqueezyCheckoutButtonProps) {
  const t = useTranslations("pricing.checkout");
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await createLemonSqueezyCheckoutAction(interval);

    if (result.error || !result.url) {
      toast({ tone: "error", title: result.error ?? t("error") });
      setLoading(false);
      return;
    }

    window.location.assign(result.url);
  }

  return (
    <LiquidButton
      type="button"
      size={size}
      className={cn("w-full bg-primary text-primary-foreground hover:bg-primary-hover", className)}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {t("redirecting")}
        </>
      ) : (
        label
      )}
    </LiquidButton>
  );
}
