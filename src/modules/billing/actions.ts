"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireMembershipResult } from "@/lib/auth";
import { getLemonSqueezyApiKey } from "@/modules/billing/lemonsqueezy";

const checkoutIntervalSchema = z.enum(["monthly", "yearly"]);

interface LemonSqueezyCheckoutResponse {
  data?: { attributes?: { url?: string } };
}

/**
 * Creates a Lemon Squeezy hosted checkout session for the caller's active
 * organization and returns its URL. Embeds the organization id as
 * `checkout_data.custom.tenant_id` — the existing webhook handler
 * (applyLemonSqueezySubscriptionEvent) requires that field on every
 * resulting event to know which organization to update.
 */
export async function createLemonSqueezyCheckoutAction(
  interval: "monthly" | "yearly",
): Promise<{ error?: string; url?: string }> {
  const t = await getTranslations("dashboard.billing");
  const auth = await requireMembershipResult();
  if ("error" in auth) return auth;
  const { membership } = auth;

  const parsedInterval = checkoutIntervalSchema.safeParse(interval);
  if (!parsedInterval.success) {
    return { error: t("error") };
  }

  const variantId =
    parsedInterval.data === "monthly"
      ? process.env.LEMONSQUEEZY_VARIANT_ID_MONTHLY
      : process.env.LEMONSQUEEZY_VARIANT_ID_YEARLY;
  const apiKey = getLemonSqueezyApiKey();
  const storeId = process.env.LEMONSQUEEZY_STORE_ID?.trim();

  if (!variantId || !apiKey || !storeId) {
    console.error(
      "[billing] Lemon Squeezy checkout is not configured (missing variant id, API key, or store id)",
    );
    return { error: t("error") };
  }

  const requestHeaders = await headers();
  const origin = `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("host")}`;

  let response: Response;
  try {
    response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: { custom: { tenant_id: membership.organizationId } },
            product_options: {
              redirect_url: `${origin}/dashboard/billing?checkout=success`,
            },
          },
          relationships: {
            store: { data: { type: "stores", id: storeId } },
            variant: { data: { type: "variants", id: variantId } },
          },
        },
      }),
    });
  } catch (error) {
    console.error("[billing] Lemon Squeezy checkout request failed:", error);
    return { error: t("error") };
  }

  if (!response.ok) {
    console.error(
      "[billing] Lemon Squeezy checkout API returned an error:",
      response.status,
      await response.text().catch(() => ""),
    );
    return { error: t("error") };
  }

  const json = (await response.json().catch(() => null)) as LemonSqueezyCheckoutResponse | null;
  const url = json?.data?.attributes?.url;
  if (!url) {
    console.error("[billing] Lemon Squeezy checkout response missing url");
    return { error: t("error") };
  }

  return { url };
}
