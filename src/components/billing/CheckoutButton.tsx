"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

interface CheckoutButtonProps {
  tier: "starter" | "pro";
  label: string;
}

export default function CheckoutButton({
  tier,
  label,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

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
        <p className="mt-2 text-xs font-medium text-status-error">{error}</p>
      )}
    </div>
  );
}
