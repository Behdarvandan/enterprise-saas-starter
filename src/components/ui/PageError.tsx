"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
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
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <AlertTriangle className="text-status-error" size={32} />
      <h1 className="mt-4 font-serif text-xl font-semibold text-ink-primary">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        An unexpected error occurred while loading this page. You can try
        again, or come back later if the problem persists.
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
