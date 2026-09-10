"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
        className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        {loading ? "Revoking..." : "Revoke"}
      </button>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
