import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * Wraps a Route Handler body so an uncaught error becomes a logged, generic
 * `{ error }` JSON response, instead of every route re-implementing the same
 * try/catch → `console.error` → 500 JSON shell. Also reports the error to
 * Sentry, since a caught-and-converted-to-JSON error never reaches Next's
 * automatic `onRequestError` instrumentation.
 */
export function withApiErrorHandling<Args extends unknown[]>(
  label: string,
  message: string,
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(`${label}:`, error);
      Sentry.captureException(error, { tags: { route: label } });
      return NextResponse.json({ error: message, code: "server_error" }, { status: 500 });
    }
  };
}
