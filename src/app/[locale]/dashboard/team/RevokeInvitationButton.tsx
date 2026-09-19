"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { revokeInvitation } from "./actions";

export default function RevokeInvitationButton({ invitationId }: { invitationId: string }) {
  const t = useTranslations("dashboard.team.pending");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRevoke() {
    setLoading(true);
    setError(null);
    const result = await revokeInvitation(invitationId);
    if (result.error) setError(result.error);
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRevoke}
        disabled={loading}
        className="rounded-md px-2 py-1.5 text-xs font-medium text-status-error transition-colors hover:bg-red-400/10 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50"
      >
        {loading ? t("revoking") : t("revoke")}
      </button>
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-status-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
