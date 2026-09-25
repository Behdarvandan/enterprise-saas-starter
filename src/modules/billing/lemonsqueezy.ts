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

export interface LemonSqueezyInvoice {
  id: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  invoiceUrl: string | null;
}

interface LemonSqueezyInvoiceListResponse {
  data?: {
    id: string;
    attributes?: {
      status?: string;
      total?: number;
      currency?: string;
      created_at?: string;
      urls?: { invoice_url?: string };
    };
  }[];
}

/**
 * Billing history for a subscription, from Lemon Squeezy's own API (this
 * codebase keeps no local invoice ledger for SaaS billing). Never throws —
 * billing history is UI chrome, not something a fetch failure should take
 * the whole billing page down for — so any missing config or request
 * failure degrades to an empty list, logged for operators to notice.
 */
export async function getLemonSqueezyInvoices(subscriptionId: string): Promise<LemonSqueezyInvoice[]> {
  const apiKey = getLemonSqueezyApiKey();
  if (!apiKey || !subscriptionId) return [];

  try {
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/subscription-invoices?filter[subscription_id]=${encodeURIComponent(subscriptionId)}&page[size]=20&sort=-created_at`,
      {
        headers: {
          Accept: "application/vnd.api+json",
          Authorization: `Bearer ${apiKey}`,
        },
        // Invoice history changes infrequently; avoid hitting the API on every render.
        next: { revalidate: 300 },
      },
    );

    if (!response.ok) {
      console.error("[billing] Lemon Squeezy invoice list request failed:", response.status);
      return [];
    }

    const json = (await response.json().catch(() => null)) as LemonSqueezyInvoiceListResponse | null;
    return (json?.data ?? []).map((item) => ({
      id: item.id,
      status: item.attributes?.status ?? "unknown",
      total: item.attributes?.total ?? 0,
      currency: item.attributes?.currency ?? "USD",
      createdAt: item.attributes?.created_at ?? new Date(0).toISOString(),
      invoiceUrl: item.attributes?.urls?.invoice_url ?? null,
    }));
  } catch (error) {
    console.error("[billing] Lemon Squeezy invoice list request failed:", error);
    return [];
  }
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
