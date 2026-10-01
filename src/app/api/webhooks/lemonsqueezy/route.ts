import { NextResponse } from "next/server";
import {
  applyLemonSqueezySubscriptionEvent,
  getLemonSqueezyWebhookSecret,
  lemonSqueezyWebhookPayloadSchema,
  verifyLemonSqueezySignature,
} from "@/modules/billing";

/**
 * POST /api/webhooks/lemonsqueezy
 *
 * Verifies the Lemon Squeezy webhook signature and applies subscription
 * events to the shared `organizations` row. See src/modules/billing/lemonsqueezy.ts
 * for the field mapping and its relationship to pasargad-core's own handler
 * for this same webhook.
 *
 * Fails closed: a missing `LEMONSQUEEZY_WEBHOOK_SECRET` is a 500
 * (misconfiguration), never an unauthenticated pass-through.
 */
export async function POST(request: Request) {
  if (!getLemonSqueezyWebhookSecret()) {
    console.error("[api/webhooks/lemonsqueezy] LEMONSQUEEZY_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 500 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("X-Signature");

  if (!verifyLemonSqueezySignature(rawBody, signatureHeader)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = lemonSqueezyWebhookPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  try {
    const result = await applyLemonSqueezySubscriptionEvent(parsed.data);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error("[api/webhooks/lemonsqueezy] handler failed:", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
