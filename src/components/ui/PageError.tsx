"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

/**
 * Shared segment-level error boundary UI for `error.tsx` files. Each
 * `error.tsx` must itself be a client component (Next.js requirement) and
 * receives `error`/`reset` from Next — this just centralizes the rendering
 * and Sentry reporting so it isn't duplicated per segment.
 */
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ui");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-5xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8"
    >
      <AlertTriangle aria-hidden className="text-status-error" size={32} />
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-100">
        {t("errorTitle")}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">{t("errorDescription")}</p>
      <Button className="mt-6" onClick={() => reset()}>
        {t("tryAgain")}
      </Button>
    </div>
  );
}
