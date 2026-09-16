"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RotateApiKeyButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  async function handleRotate() {
    setLoading(true);
    setError(null);
    setNewKey(null);

    const response = await fetch("/api/client/license/rotate", {
      method: "POST",
    }).catch(() => null);

    if (!response) {
      setError("Something went wrong.");
      setLoading(false);
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    setNewKey(data.apiKey);
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      <Button type="button" variant="secondary" onClick={handleRotate} disabled={loading}>
        <KeyRound size={16} />
        {loading ? "Rotating..." : "Regenerate API key"}
      </Button>

      {newKey && (
        <div className="mt-3 rounded-control border border-status-success/30 bg-status-success/10 p-3">
          <p className="text-xs font-semibold text-status-success">
            Copy this key now — it won&apos;t be shown again.
          </p>
          <p className="mt-1 break-all font-mono text-xs text-ink-primary">{newKey}</p>
        </div>
      )}

      {error && <p className="mt-2 text-xs font-medium text-status-error">{error}</p>}
    </div>
  );
}
