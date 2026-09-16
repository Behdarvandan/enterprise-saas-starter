import { NextResponse } from "next/server";
import { getPaymentAdapter } from "@/lib/payment/adapter";
import { mapWebhookError } from "@/lib/payment/webhook-error";

/**
 * POST /api/webhooks/stripe
 *
 * Verifies the Stripe webhook signature and delegates event processing to the
 * Stripe payment adapter, which applies idempotent side effects to bookings
 * and subscriptions.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("stripe-signature");

  try {
    await getPaymentAdapter("stripe").handleWebhookEvent({
      rawBody,
      signatureHeader,
    });
  } catch (error) {
    const mapped = mapWebhookError("stripe", error);
    const message =
      mapped.kind === "signature"
        ? "Invalid signature."
        : mapped.kind === "configuration"
          ? "Webhook secret is not configured."
          : "Webhook handler failed.";

    return NextResponse.json({ error: message }, { status: mapped.status });
  }

  return NextResponse.json({ received: true });
}
