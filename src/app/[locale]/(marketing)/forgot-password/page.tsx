"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { KeyRound } from "lucide-react";
import { Card } from "@/core/ui/primitives/card";
import { Button } from "@/core/ui/primitives/button";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleResetRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await requestPasswordReset(email);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setMessage(t("successMessage"));
    setLoading(false);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20 sm:px-6">
      <Card className="p-8">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-control bg-primary text-primary-foreground">
          <KeyRound size={22} />
        </div>
        <h1 className="text-xl font-bold text-ink-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>

        <form onSubmit={handleResetRequest} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              {t("emailLabel")}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-ring"
            />
          </div>

          {error && (
            <p className="rounded-control bg-status-error/10 px-3 py-2 text-xs font-medium text-status-error">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-control bg-status-success/10 px-3 py-2 text-xs font-medium text-status-success">
              {message}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("sending") : t("sendButton")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          {t("rememberedPassword")}{" "}
          <Link href="/login" className="font-semibold text-ring hover:text-primary">
            {t("signIn")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
