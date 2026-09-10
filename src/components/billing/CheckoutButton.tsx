"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface CheckoutButtonProps {
  priceId: string;
  label: string;
}

export default function CheckoutButton({
  priceId,
  label,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      if (!data.url) {
        setError("Could not start checkout.");
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
        onClick={handleCheckout}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Redirecting..." : label}
      </Button>
      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}
