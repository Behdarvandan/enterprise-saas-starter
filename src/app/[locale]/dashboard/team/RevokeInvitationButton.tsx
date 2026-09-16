"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { revokeInvitation } from "./actions";

export default function RevokeInvitationButton({
  invitationId,
}: {
  invitationId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRevoke() {
    setLoading(true);
    setError(null);
    const result = await revokeInvitation(invitationId);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRevoke}
        disabled={loading}
        className="rounded-control px-2 py-1.5 text-xs font-semibold text-status-error transition-colors hover:bg-status-error/10 disabled:opacity-50"
      >
        {loading ? "Revoking..." : "Revoke"}
      </button>
      {error && <p className="mt-1 text-xs font-medium text-status-error">{error}</p>}
    </div>
  );
}
