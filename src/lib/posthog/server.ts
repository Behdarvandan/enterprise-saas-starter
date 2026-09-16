import { PostHog } from "posthog-node";

let client: PostHog | null = null;

/**
 * Lazily creates the server-side PostHog client, for capturing events from
 * Server Actions / Route Handlers. Reuses the same public project key as
 * the browser client — PostHog's project API key isn't a secret the way a
 * Stripe/service-role key is, so no separate server-only key is needed.
 * Returns `null` when `NEXT_PUBLIC_POSTHOG_KEY` is unset so callers can
 * no-op in local dev without a PostHog project configured.
 */
export function getPostHogServerClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  if (!client) {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      // Serverless-friendly: flush every event immediately rather than
      // batching, since the process may not stay alive long enough to
      // flush on an interval.
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return client;
}
