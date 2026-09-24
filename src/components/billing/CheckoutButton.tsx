"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/core/ui/primitives/button";

interface CheckoutButtonProps {
  tier: "starter" | "pro";
  label: string;
}

export default function CheckoutButton({
  tier,
  label,
}: CheckoutButtonProps) {
  const t = useTranslations("pricing.checkout");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    setFailed(false);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      // Not signed in: send them to sign up instead of showing a dead-end
      // error. The tier is preserved in the query string for a future
      // "continue to checkout after signup" flow — nothing reads it yet.
      if (response.status === 401) {
        router.push(`/signup?tier=${encodeURIComponent(tier)}`);
        return;
      }

      const data: { url?: string; error?: string } = await response.json();

      if (!response.ok || data.error || !data.url) {
        console.error("[checkout] request failed:", data.error);
        setFailed(true);
        return;
      }

      window.location.assign(data.url);
    } catch (error) {
      console.error("[checkout] request failed:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button type="button" onClick={handleCheckout} loading={loading} className="w-full">
        {loading ? t("redirecting") : label}
      </Button>
      {failed ? (
        <p role="alert" className="mt-2 text-xs font-medium text-status-error">
          {t("error")}
        </p>
      ) : null}
    </div>
  );
}
