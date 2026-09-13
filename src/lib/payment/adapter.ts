import { createHmac, timingSafeEqual } from "node:crypto";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  activateOrganizationById,
  cancelAppointmentById,
  confirmAppointmentById,
  persistSubscriptionSnapshot,
} from "./handlers";

/**
 * Modular payment-provider adapter layer.
 *
 * Every provider implements the same `PaymentAdapter` contract so checkout
 * routes and webhook handlers never branch on vendor-specific SDKs. The active
 * provider is resolved from `NEXT_PUBLIC_PAYMENT_PROVIDER` and defaults to
 * Stripe.
 */

export type PaymentProvider = "stripe" | "paytr";

export type CheckoutMode = "payment" | "subscription";

export interface CheckoutLineItem {
  /** Display name shown on the payment page. */
  name: string;
  /** Unit price in minor units (cents for Stripe, kurus for PayTR TL). */
  unitAmount: number;
  quantity?: number;
}

export interface InstallmentOptions {
  /** Hide installment options entirely (PayTR `no_installment`). */
  disabled?: boolean;
  /** Maximum allowed installment count (PayTR `max_installment`). */
  maxCount?: number;
}

export interface CreateCheckoutSessionInput {
  mode: CheckoutMode;
  /** Customer details. */
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerIp?: string | null;
  /** Organization id used as the billing reference / callback target. */
  organizationId?: string | null;
  /** Provider-side customer id (Stripe), reused when already provisioned. */
  existingCustomerId?: string | null;
  /** Stripe price id for subscription checkout. */
  priceId?: string | null;
  /** One-time payment line items. */
  lineItems?: CheckoutLineItem[];
  /** Explicit total amount in minor units (required for PayTR subscriptions). */
  amount?: number | null;
  /** Currency code, e.g. "usd" for Stripe or "TL"/"TRY" for PayTR. */
  currency?: string | null;
  /** PayTR installment configuration. */
  installments?: InstallmentOptions;
  /** Provider-agnostic order reference echoed back in the callback. */
  merchantOrderId?: string | null;
  /** Arbitrary metadata attached to the session. */
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  /** Unix timestamp in seconds after which the session expires (Stripe). */
  expiresAt?: number | null;
}

export interface CreateCheckoutSessionResult {
  /** Redirect URL for the customer (or PayTR hosted payment page). */
  url: string | null;
  /** Provider-side session/order identifier. */
  providerReference?: string | null;
  /** PayTR iframe token, when applicable. */
  iframeToken?: string | null;
}

export interface HandleWebhookEventInput {
  /** Raw request body as text. */
  rawBody: string;
  /** Signature header (Stripe `stripe-signature`). */
  signatureHeader?: string | null;
  /** Decoded PayTR callback fields, when applicable. */
  callbackFields?: Record<string, string>;
}

export interface CancelSubscriptionInput {
  subscriptionId: string;
}

export interface PaymentAdapter {
  readonly provider: PaymentProvider;

  createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult>;

  /**
   * Verifies an incoming provider notification and applies its side effects.
   * Throws `WebhookSignatureError` on verification failures and
   * `WebhookConfigurationError` when provider credentials are missing.
   */
  handleWebhookEvent(input: HandleWebhookEventInput): Promise<void>;

  cancelSubscription(input: CancelSubscriptionInput): Promise<void>;
}

/** Raised when an incoming webhook fails signature/verification checks. */
export class WebhookSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookSignatureError";
  }
}

/** Raised when provider credentials are missing or misconfigured. */
export class WebhookConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookConfigurationError";
  }
}

/**
 * Reads the active provider from `NEXT_PUBLIC_PAYMENT_PROVIDER` ('stripe' or
 * 'paytr'). Unknown or missing values fall back to Stripe.
 */
export function resolvePaymentProvider(): PaymentProvider {
  const value = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? "stripe")
    .trim()
    .toLowerCase();
  return value === "paytr" ? "paytr" : "stripe";
}

const adapters = new Map<PaymentProvider, PaymentAdapter>();

/**
 * Returns a cached adapter instance. When no provider is supplied, the
 * environment-configured provider is used. Webhook routes may pin a specific
 * provider (e.g. `getPaymentAdapter("paytr")`) regardless of the env var.
 */
export function getPaymentAdapter(provider?: PaymentProvider): PaymentAdapter {
  const resolved = provider ?? resolvePaymentProvider();
  const existing = adapters.get(resolved);
  if (existing) return existing;

  const adapter = resolved === "paytr" ? new PayTRAdapter() : new StripeAdapter();
  adapters.set(resolved, adapter);
  return adapter;
}

// ---------------------------------------------------------------------------
// Shared crypto helpers
// ---------------------------------------------------------------------------

function hmacSha256Base64(key: string, message: string): string {
  return createHmac("sha256", key).update(message, "utf8").digest("base64");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

// ---------------------------------------------------------------------------
// PayTR order-id encoding
// ---------------------------------------------------------------------------
//
// PayTR's `merchant_oid` must be a unique, alphanumeric value (max 64 chars).
// We encode a UUID without hyphens and prefix it so the webhook can tell
// whether a callback refers to an appointment or an organization.

const ORDER_PREFIX_APPOINTMENT = "apt";
const ORDER_PREFIX_ORGANIZATION = "org";

function toHexUuid(uuid: string): string {
  return uuid.replace(/-/g, "");
}

function fromHexUuid(hex: string): string {
  if (hex.length !== 32) return hex;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function encodeAppointmentOrderId(appointmentId: string): string {
  return `${ORDER_PREFIX_APPOINTMENT}${toHexUuid(appointmentId)}`;
}

export function encodeOrganizationOrderId(organizationId: string): string {
  return `${ORDER_PREFIX_ORGANIZATION}${toHexUuid(organizationId)}`;
}

interface DecodedOrderId {
  type: "appointment" | "organization";
  id: string;
}

export function decodeMerchantOrderId(
  merchantOid: string,
): DecodedOrderId | null {
  if (merchantOid.startsWith(ORDER_PREFIX_APPOINTMENT)) {
    const hex = merchantOid.slice(ORDER_PREFIX_APPOINTMENT.length);
    if (hex.length !== 32) return null;
    return { type: "appointment", id: fromHexUuid(hex) };
  }

  if (merchantOid.startsWith(ORDER_PREFIX_ORGANIZATION)) {
    const hex = merchantOid.slice(ORDER_PREFIX_ORGANIZATION.length);
    if (hex.length !== 32) return null;
    return { type: "organization", id: fromHexUuid(hex) };
  }

  return null;
}

function buildUserBasket(lineItems: CheckoutLineItem[]): string {
  const basket = lineItems.map((item) => [
    item.name,
    (item.unitAmount / 100).toFixed(2),
    item.quantity ?? 1,
  ]);
  return JSON.stringify(basket);
}

// ---------------------------------------------------------------------------
// Stripe adapter
// ---------------------------------------------------------------------------

export class StripeAdapter implements PaymentAdapter {
  readonly provider = "stripe" as const;

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult> {
    const stripe = getStripe();

    if (input.mode === "subscription") {
      if (!input.priceId) {
        throw new Error("Stripe subscription checkout requires a price id.");
      }
      if (!input.existingCustomerId) {
        throw new Error(
          "Stripe subscription checkout requires an existing customer id.",
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer: input.existingCustomerId,
        line_items: [{ price: input.priceId, quantity: 1 }],
        client_reference_id: input.organizationId ?? undefined,
        allow_promotion_codes: true,
        ...(input.organizationId
          ? {
              subscription_data: {
                metadata: { organization_id: input.organizationId },
              },
            }
          : {}),
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      });

      return { url: session.url, providerReference: session.id };
    }

    const lineItems = input.lineItems ?? [];
    if (lineItems.length === 0) {
      throw new Error("Stripe one-time checkout requires at least one line item.");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.customerEmail ?? undefined,
      client_reference_id: input.merchantOrderId ?? undefined,
      line_items: lineItems.map((item) => ({
        quantity: item.quantity ?? 1,
        price_data: {
          currency: input.currency ?? "usd",
          unit_amount: item.unitAmount,
          product_data: { name: item.name },
        },
      })),
      metadata: input.metadata,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      expires_at: input.expiresAt ?? undefined,
    });

    return { url: session.url, providerReference: session.id };
  }

  async handleWebhookEvent(input: HandleWebhookEventInput): Promise<void> {
    const signature = input.signatureHeader;
    if (!signature) {
      throw new WebhookSignatureError("Missing stripe-signature header.");
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new WebhookConfigurationError(
        "STRIPE_WEBHOOK_SECRET is not configured.",
      );
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        input.rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      console.error("[stripe-webhook] Signature verification failed:", error);
      throw new WebhookSignatureError("Invalid signature.");
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.metadata?.appointment_id) {
            await this.handleBookingCompleted(session);
          } else {
            await this.handleCheckoutCompleted(session);
          }
          break;
        }
        case "checkout.session.expired":
        case "checkout.session.async_payment_failed": {
          const session = event.data.object as Stripe.Checkout.Session;
          await this.handleBookingCancelled(session);
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          await this.syncSubscription(subscription);
          break;
        }
        default:
          // Acknowledge unhandled events so Stripe does not retry them.
          console.info(`[stripe-webhook] Ignoring unhandled event: ${event.type}`);
          break;
      }
    } catch (error) {
      console.error(
        `[stripe-webhook] Error handling event ${event.type} (id: ${event.id}):`,
        error,
      );
      throw error;
    }
  }

  async cancelSubscription(input: CancelSubscriptionInput): Promise<void> {
    await getStripe().subscriptions.cancel(input.subscriptionId);
  }

  private async handleBookingCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const appointmentId = session.metadata?.appointment_id;
    if (!appointmentId) return;

    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : null;

    await confirmAppointmentById(appointmentId, paymentIntentId);
  }

  private async handleBookingCancelled(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const appointmentId = session.metadata?.appointment_id;
    if (!appointmentId) return;

    await cancelAppointmentById(appointmentId);
  }

  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;
    if (!subscriptionId) {
      console.warn(
        "[stripe-webhook] checkout.session.completed without a subscription id.",
      );
      return;
    }

    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    await this.persistSubscription(subscription, session.client_reference_id);
  }

  private async syncSubscription(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    await this.persistSubscription(subscription, null);
  }

  private async persistSubscription(
    subscription: Stripe.Subscription,
    organizationId: string | null,
  ): Promise<void> {
    const price = subscription.items.data[0]?.price;
    let planId: string | null = null;
    if (typeof price === "string") {
      planId = price;
    } else if (price) {
      planId = price.id;
    }

    const currentPeriodEnd =
      subscription.items.data[0]?.current_period_end ?? null;

    await persistSubscriptionSnapshot(
      {
        customerId: String(subscription.customer),
        subscriptionId: subscription.id,
        planId,
        status: subscription.status,
        currentPeriodEnd: currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : null,
      },
      organizationId,
    );
  }
}

// ---------------------------------------------------------------------------
// PayTR adapter (iFrame API)
// ---------------------------------------------------------------------------

interface PayTRConfig {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  testMode: string;
  currency: string;
  noInstallment: string;
  maxInstallment: string;
  timeoutLimit: string;
  debugOn: string;
  lang: string;
  baseUrl: string;
}

const PAYTR_GET_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";

export class PayTRAdapter implements PaymentAdapter {
  readonly provider = "paytr" as const;

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult> {
    const config = this.getConfig();
    this.requireMerchantConfig(config);

    if (input.mode === "subscription") {
      return this.createPlanActivationCheckout(input, config);
    }

    return this.createPaymentCheckout(input, config);
  }

  async handleWebhookEvent(input: HandleWebhookEventInput): Promise<void> {
    const fields = input.callbackFields;
    if (!fields) {
      throw new WebhookSignatureError("Missing PayTR callback fields.");
    }

    const config = this.getConfig();
    this.requireMerchantConfig(config);

    const merchantOid = fields.merchant_oid ?? "";
    const status = fields.status ?? "";
    const totalAmount = fields.total_amount ?? "";
    // PayTR names the callback signature field `hash`; older integrations
    // and some documentation refer to it as `paytr_token`, so accept both.
    const providedHash = fields.hash ?? fields.paytr_token ?? "";

    if (!merchantOid || !status || !totalAmount || !providedHash) {
      throw new WebhookSignatureError("Missing required PayTR callback fields.");
    }

    const expectedHash = this.computeCallbackHash(
      config,
      merchantOid,
      status,
      totalAmount,
    );

    if (!safeEqual(expectedHash, providedHash)) {
      throw new WebhookSignatureError("Invalid PayTR callback hash.");
    }

    if (status !== "success") {
      console.info(
        `[paytr-webhook] Payment for order ${merchantOid} was not successful; no state change applied.`,
      );
      return;
    }

    const order = decodeMerchantOrderId(merchantOid);
    if (!order) {
      throw new Error(`[paytr-webhook] Unrecognized PayTR order id: ${merchantOid}`);
    }

    if (order.type === "appointment") {
      await confirmAppointmentById(order.id);
    } else {
      await activateOrganizationById(order.id);
    }
  }

  async cancelSubscription(input: CancelSubscriptionInput): Promise<void> {
    throw new Error(
      `Subscription cancellation (${input.subscriptionId}) is not supported by the PayTR adapter.`,
    );
  }

  private createPlanActivationCheckout(
    input: CreateCheckoutSessionInput,
    config: PayTRConfig,
  ): Promise<CreateCheckoutSessionResult> {
    if (!input.amount || input.amount <= 0) {
      throw new Error(
        "PayTR plan activation requires an explicit amount in minor units.",
      );
    }
    if (!input.organizationId) {
      throw new Error("PayTR plan activation requires an organization id.");
    }

    const lineItems =
      input.lineItems && input.lineItems.length > 0
        ? input.lineItems
        : [
            {
              name: input.priceId ?? "Subscription plan",
              unitAmount: input.amount,
              quantity: 1,
            },
          ];

    return this.createHostedPayment(input, config, {
      merchantOid: encodeOrganizationOrderId(input.organizationId),
      amount: input.amount,
      lineItems,
      currency: input.currency ?? config.currency,
      // Plan activation is a single charge, never split into installments.
      noInstallment: "1",
      maxInstallment: "1",
    });
  }

  private createPaymentCheckout(
    input: CreateCheckoutSessionInput,
    config: PayTRConfig,
  ): Promise<CreateCheckoutSessionResult> {
    const lineItems = input.lineItems ?? [];
    if (lineItems.length === 0) {
      throw new Error("PayTR one-time checkout requires at least one line item.");
    }
    if (!input.merchantOrderId) {
      throw new Error(
        "PayTR requires a merchant order id to correlate the callback.",
      );
    }

    const amount =
      input.amount ??
      lineItems.reduce(
        (sum, item) => sum + item.unitAmount * (item.quantity ?? 1),
        0,
      );

    if (amount <= 0) {
      throw new Error("PayTR requires a positive payment amount.");
    }

    const noInstallment = input.installments?.disabled
      ? "1"
      : config.noInstallment;
    const maxInstallment = String(
      input.installments?.maxCount ??
        (Number.parseInt(config.maxInstallment, 10) || 12),
    );

    return this.createHostedPayment(input, config, {
      merchantOid: input.merchantOrderId,
      amount,
      lineItems,
      currency: input.currency ?? config.currency,
      noInstallment,
      maxInstallment,
    });
  }

  private async createHostedPayment(
    input: CreateCheckoutSessionInput,
    config: PayTRConfig,
    params: {
      merchantOid: string;
      amount: number;
      lineItems: CheckoutLineItem[];
      currency: string;
      noInstallment: string;
      maxInstallment: string;
    },
  ): Promise<CreateCheckoutSessionResult> {
    const email = input.customerEmail ?? "";
    if (!email) {
      throw new Error("PayTR requires a customer email.");
    }

    const userIp = input.customerIp || "0.0.0.0";
    const userBasket = buildUserBasket(params.lineItems);

    const token = this.buildToken(config, {
      merchantId: config.merchantId,
      userIp,
      merchantOid: params.merchantOid,
      email,
      paymentAmount: String(params.amount),
      userBasket,
      noInstallment: params.noInstallment,
      maxInstallment: params.maxInstallment,
      currency: params.currency,
      testMode: config.testMode,
    });

    const fields: Record<string, string> = {
      merchant_id: config.merchantId,
      merchant_key: config.merchantKey,
      merchant_salt: config.merchantSalt,
      email,
      payment_amount: String(params.amount),
      merchant_oid: params.merchantOid,
      user_name: input.customerName ?? "",
      user_address: "",
      user_phone: input.customerPhone ?? "",
      merchant_ok_url: input.successUrl,
      merchant_fail_url: input.cancelUrl,
      user_basket: userBasket,
      user_ip: userIp,
      timeout_limit: config.timeoutLimit,
      debug_on: config.debugOn,
      test_mode: config.testMode,
      lang: config.lang,
      no_installment: params.noInstallment,
      max_installment: params.maxInstallment,
      currency: params.currency,
      paytr_token: token,
    };

    const iframeToken = await this.requestToken(fields);

    return {
      url: `${config.baseUrl}/odeme/guvenli/${iframeToken}`,
      iframeToken,
      providerReference: params.merchantOid,
    };
  }

  private async requestToken(fields: Record<string, string>): Promise<string> {
    const body = new URLSearchParams(fields).toString();

    const response = await fetch(PAYTR_GET_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `PayTR get-token request failed with HTTP status ${response.status}.`,
      );
    }

    const data = (await response.json()) as {
      status?: string;
      token?: string;
      reason?: string;
    };

    if (data.status !== "success" || !data.token) {
      throw new Error(data.reason ?? "PayTR get-token request failed.");
    }

    return data.token;
  }

  private buildToken(
    config: PayTRConfig,
    params: {
      merchantId: string;
      userIp: string;
      merchantOid: string;
      email: string;
      paymentAmount: string;
      userBasket: string;
      noInstallment: string;
      maxInstallment: string;
      currency: string;
      testMode: string;
    },
  ): string {
    const hashStr = [
      params.merchantId,
      params.userIp,
      params.merchantOid,
      params.email,
      params.paymentAmount,
      params.userBasket,
      params.noInstallment,
      params.maxInstallment,
      params.currency,
      params.testMode,
    ].join("");

    return hmacSha256Base64(
      config.merchantKey,
      `${hashStr}${config.merchantSalt}`,
    );
  }

  private computeCallbackHash(
    config: PayTRConfig,
    merchantOid: string,
    status: string,
    totalAmount: string,
  ): string {
    const message = `${merchantOid}${config.merchantSalt}${status}${totalAmount}`;
    return hmacSha256Base64(config.merchantKey, message);
  }

  private getConfig(): PayTRConfig {
    return {
      merchantId: process.env.PAYTR_MERCHANT_ID ?? "",
      merchantKey: process.env.PAYTR_MERCHANT_KEY ?? "",
      merchantSalt: process.env.PAYTR_MERCHANT_SALT ?? "",
      testMode: process.env.PAYTR_TEST_MODE ?? "0",
      currency: process.env.PAYTR_CURRENCY ?? "TL",
      noInstallment: process.env.PAYTR_NO_INSTALLMENT ?? "0",
      maxInstallment: process.env.PAYTR_MAX_INSTALLMENT ?? "12",
      timeoutLimit: process.env.PAYTR_TIMEOUT_LIMIT ?? "30",
      debugOn: process.env.PAYTR_DEBUG_ON ?? "0",
      lang: "en",
      baseUrl: "https://www.paytr.com",
    };
  }

  private requireMerchantConfig(config: PayTRConfig): void {
    if (!config.merchantId || !config.merchantKey || !config.merchantSalt) {
      throw new WebhookConfigurationError(
        "PayTR merchant credentials are not configured.",
      );
    }
  }
}






