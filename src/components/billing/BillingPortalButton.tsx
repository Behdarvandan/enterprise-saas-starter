"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function BillingPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenPortal() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing-portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      window.location.assign(data.url);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        onClick={handleOpenPortal}
        disabled={loading}
      >
        {loading ? "Loading..." : "Manage billing"}
      </Button>
      {error && (
        <p className="mt-2 text-xs font-medium text-status-error">{error}</p>
      )}
    </div>
  );
}
