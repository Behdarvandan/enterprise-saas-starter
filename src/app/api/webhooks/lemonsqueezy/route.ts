import { NextResponse } from "next/server";
import {
  applyLemonSqueezySubscriptionEvent,
  verifyLemonSqueezySignature,
  type LemonSqueezyWebhookPayload,
} from "@/modules/billing";

/**
 * POST /api/webhooks/lemonsqueezy
 *
 * Verifies the Lemon Squeezy webhook signature and applies subscription
 * events to the shared `organizations` row. See src/modules/billing/lemonsqueezy.ts
 * for the field mapping and its relationship to pasargad-core's own handler
 * for this same webhook.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("X-Signature");

  if (!verifyLemonSqueezySignature(rawBody, signatureHeader)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: LemonSqueezyWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  try {
    const result = await applyLemonSqueezySubscriptionEvent(payload);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error("[api/webhooks/lemonsqueezy] handler failed:", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
