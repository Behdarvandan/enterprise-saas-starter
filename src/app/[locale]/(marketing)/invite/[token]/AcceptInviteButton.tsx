"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { acceptInvitation } from "./actions";

export default function AcceptInviteButton({ token }: { token: string }) {
  const t = useTranslations("auth.invite");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);

    const result = await acceptInvitation(token);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleAccept} disabled={loading} className="w-full">
        {loading ? t("joining") : t("acceptButton")}
      </Button>
      {error && (
        <p className="mt-2 text-xs font-medium text-status-error">{error}</p>
      )}
    </div>
  );
}
