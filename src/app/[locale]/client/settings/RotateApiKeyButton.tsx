"use client";

import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

export default function RotateApiKeyButton() {
  const t = useTranslations("client.settings.license");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  async function handleRotate() {
    setLoading(true);
    setFailed(false);
    setNewKey(null);

    const response = await fetch("/api/client/license/rotate", { method: "POST" }).catch((error: unknown) => {
      console.error("[license] rotate request failed:", error);
      return null;
    });
    const data: { apiKey?: string; error?: string } = response ? await response.json().catch(() => ({})) : {};

    if (!response || !response.ok || data.error || !data.apiKey) {
      setFailed(true);
      setLoading(false);
      return;
    }

    setNewKey(data.apiKey);
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      <Button type="button" variant="secondary" onClick={handleRotate} loading={loading}>
        {loading ? null : <KeyRound aria-hidden />}
        {loading ? t("rotating") : t("rotate")}
      </Button>
      {newKey ? (
        <div role="status" className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="text-xs font-semibold text-emerald-300">{t("copyNow")}</p>
          <p dir="ltr" className="mt-1 text-start font-mono text-xs break-all text-slate-100">
            {newKey}
          </p>
        </div>
      ) : null}
      {failed ? (
        <p role="alert" className="mt-2 text-xs font-medium text-status-error">
          {t("error")}
        </p>
      ) : null}
    </div>
  );
}
