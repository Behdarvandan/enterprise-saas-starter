import { z } from "zod";
import { createCoreAdminClient } from "@/core/db";
import { verifyHmacSha256Hex } from "@/lib/security";

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

/** Reads the webhook signing secret; `undefined` when unset. */
export function getLemonSqueezyWebhookSecret(): string | undefined {
  return process.env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim() || undefined;
}

/**
 * HMAC-SHA256 signature check, mirroring pasargad-core's own
 * `_verify_signature`.
 *
 * Fails closed: without a configured secret every request is rejected. The
 * webhook route reports that as a configuration error (500) before calling
 * this, so an unset secret can never turn the endpoint into an unauthenticated
 * write path to `organizations`.
 */
export function verifyLemonSqueezySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = getLemonSqueezyWebhookSecret();
  if (!secret) {
    console.error("[billing] LEMONSQUEEZY_WEBHOOK_SECRET not set; rejecting webhook");
    return false;
  }
  return verifyHmacSha256Hex(rawBody, signatureHeader, secret);
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

const idLike = z.union([z.string(), z.number()]);

/**
 * Runtime schema for the subset of the Lemon Squeezy webhook payload this
 * handler reads. Unknown keys are ignored; everything read is optional here
 * and checked explicitly in `applyLemonSqueezySubscriptionEvent`.
 */
export const lemonSqueezyWebhookPayloadSchema = z.object({
  meta: z
    .object({
      event_name: z.string().optional(),
      custom_data: z
        .object({
          tenant_id: z.string().optional(),
          tenantId: z.string().optional(),
          plan_name: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  data: z
    .object({
      id: idLike.optional(),
      attributes: z
        .object({
          id: idLike.optional(),
          status: z.string().optional(),
          renews_at: z.string().nullish(),
          ends_at: z.string().nullish(),
          customer_id: idLike.nullish(),
          variant_name: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type LemonSqueezyWebhookPayload = z.infer<typeof lemonSqueezyWebhookPayloadSchema>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  if (!tenantId || !UUID_PATTERN.test(tenantId)) {
    throw new Error("meta.custom_data.tenant_id must be a valid organization id");
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

  const updateRow: Record<string, string | null | undefined> = {
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
