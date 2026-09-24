import { createHmac, timingSafeEqual } from "node:crypto";
import { createCoreAdminClient } from "@/core/db";

const HANDLED_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "sub_created",
  "sub_updated",
]);

/** Reads the Lemon Squeezy API key. No outbound API call is in scope yet — this is an accessor only. */
export function getLemonSqueezyApiKey(): string | undefined {
  return process.env.LEMONSQUEEZY_API_KEY?.trim() || undefined;
}

/** HMAC-SHA256 signature check, mirroring pasargad-core's own `_verify_signature`. */
export function verifyLemonSqueezySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[billing] LEMONSQUEEZY_WEBHOOK_SECRET not set; skipping signature verification");
    return true;
  }
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signatureHeader);

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export interface LemonSqueezyWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: { tenant_id?: string; tenantId?: string; plan_name?: string };
  };
  data?: {
    id?: string | number;
    attributes?: {
      id?: string | number;
      status?: string;
      renews_at?: string;
      ends_at?: string;
      customer_id?: string | number;
      variant_name?: string;
    };
  };
}

/**
 * Applies a Lemon Squeezy subscription webhook event to the shared
 * `organizations` row. Mirrors pasargad-core's own handler's field mapping
 * (same organizations columns), and additionally handles
 * "subscription_cancelled", which pasargad-core's HANDLED_WEBHOOK_EVENTS
 * doesn't cover yet.
 */
export async function applyLemonSqueezySubscriptionEvent(
  payload: LemonSqueezyWebhookPayload,
): Promise<{ status: string; event: string }> {
  const eventName = payload.meta?.event_name ?? "";
  if (!HANDLED_EVENTS.has(eventName)) {
    return { status: "ignored", event: eventName };
  }

  const customData = payload.meta?.custom_data ?? {};
  const tenantId = customData.tenant_id ?? customData.tenantId;
  if (!tenantId) {
    throw new Error("meta.custom_data.tenant_id is required");
  }

  const attributes = payload.data?.attributes ?? {};
  const subscriptionId = String(payload.data?.id ?? attributes.id ?? "");
  if (!subscriptionId) {
    throw new Error("data.id (subscription id) is missing");
  }

  const supabase = createCoreAdminClient();

  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", tenantId)
    .limit(1);

  if (!existing || existing.length === 0) {
    throw new Error(`organization ${tenantId} not found`);
  }

  const subscriptionStatus = eventName === "subscription_cancelled" ? "cancelled" : (attributes.status ?? "unknown");

  const updateRow: Record<string, unknown> = {
    provider_subscription_id: subscriptionId,
    plan_id: customData.plan_name ?? attributes.variant_name,
    subscription_status: subscriptionStatus,
    current_period_end: attributes.renews_at ?? attributes.ends_at,
  };
  if (attributes.customer_id != null) {
    updateRow.provider_customer_id = String(attributes.customer_id);
  }

  const { error } = await supabase.from("organizations").update(updateRow).eq("id", tenantId);
  if (error) {
    throw new Error("[billing] failed to update organization from Lemon Squeezy event");
  }

  return { status: "updated", event: eventName };
}
