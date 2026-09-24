"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/core/ui/primitives/button";

export default function BillingPortalButton() {
  const t = useTranslations("dashboard.billing");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleOpenPortal() {
    setLoading(true);
    setFailed(false);

    try {
      const response = await fetch("/api/billing-portal", { method: "POST" });
      const data: { url?: string; error?: string } = await response.json();

      if (!response.ok || data.error || !data.url) {
        console.error("[billing] portal request failed:", data.error);
        setFailed(true);
        return;
      }

      window.location.assign(data.url);
    } catch (error) {
      console.error("[billing] portal request failed:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button type="button" variant="secondary" onClick={handleOpenPortal} loading={loading}>
        {loading ? t("loading") : t("manage")}
      </Button>
      {failed ? (
        <p role="alert" className="mt-2 text-xs font-medium text-status-error">
          {t("error")}
        </p>
      ) : null}
    </div>
  );
}
