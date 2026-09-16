"use client";

import { useState } from "react";
import LegacyButton from "@/components/ui/LegacyButton";
import { acceptInvitation } from "./actions";

export default function AcceptInviteButton({ token }: { token: string }) {
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
      <LegacyButton onClick={handleAccept} disabled={loading} className="w-full">
        {loading ? "Joining..." : "Accept invitation"}
      </LegacyButton>
      {error && (
        <p className="mt-2 text-xs font-medium text-status-error">{error}</p>
      )}
    </div>
  );
}
