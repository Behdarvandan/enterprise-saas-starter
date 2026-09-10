import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  // Enable Node profiling for server-side transactions.
  profilesSampleRate: 1.0,
});
