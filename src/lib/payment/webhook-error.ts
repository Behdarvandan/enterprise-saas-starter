import * as Sentry from "@sentry/nextjs";
import { WebhookConfigurationError, WebhookSignatureError } from "@/lib/payment/adapter";

export type WebhookErrorKind = "signature" | "configuration" | "unknown";

export interface MappedWebhookError {
  kind: WebhookErrorKind;
  status: number;
}

/**
 * Classifies a webhook handler error into a status code + kind, logging it
 * with a provider-scoped prefix. Shared by the Stripe and PayTR webhook
 * routes, which otherwise duplicated this exact `instanceof` triage — each
 * route still builds its own response body from `kind` (JSON for Stripe,
 * plain text for PayTR).
 */
export function mapWebhookError(provider: string, error: unknown): MappedWebhookError {
  const prefix = `[${provider}-webhook]`;

  if (error instanceof WebhookSignatureError) {
    // Not sent to Sentry: invalid signatures are routinely caused by
    // scanners/bots probing the endpoint with garbage payloads, not by
    // application bugs, and would otherwise be the dominant noise source.
    console.error(`${prefix} Signature verification failed:`, error.message);
    return { kind: "signature", status: 400 };
  }

  if (error instanceof WebhookConfigurationError) {
    console.error(`${prefix} Configuration error:`, error.message);
    Sentry.captureException(error, { tags: { provider } });
    return { kind: "configuration", status: 500 };
  }

  console.error(`${prefix} Webhook handler failed:`, error);
  Sentry.captureException(error, { tags: { provider } });
  return { kind: "unknown", status: 500 };
}
