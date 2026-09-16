import posthog from "posthog-js";

let initialized = false;

/**
 * Lazily initializes the browser PostHog client exactly once per page load.
 * Returns `null` (no-op) when `NEXT_PUBLIC_POSTHOG_KEY` is unset, mirroring
 * how the Sentry DSN is optional in local dev — this module only sets up
 * the client; wiring a provider into the root layout and instrumenting
 * specific events (lead submit, invoice download, etc.) is deferred to a
 * later phase.
 */
export function initPostHogClient(): typeof posthog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  if (!initialized) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
    });
    initialized = true;
  }

  return posthog;
}

export { posthog };
