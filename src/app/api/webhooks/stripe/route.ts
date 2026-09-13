import { NextResponse } from "next/server";
import {
  getPaymentAdapter,
  WebhookConfigurationError,
  WebhookSignatureError,
} from "@/lib/payment/adapter";

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
    if (error instanceof WebhookSignatureError) {
      console.error(
        "[stripe-webhook] Signature verification failed:",
        error.message,
      );
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    if (error instanceof WebhookConfigurationError) {
      console.error("[stripe-webhook] Configuration error:", error.message);
      return NextResponse.json(
        { error: "Webhook secret is not configured." },
        { status: 500 },
      );
    }

    console.error("[stripe-webhook] Webhook handler failed:", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
