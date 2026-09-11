import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppointmentDetails } from "@/lib/booking";
import { sendBookingConfirmationEmail } from "@/lib/email";
import type { Database } from "@/types/database";

type OrganizationUpdate = Database["public"]["Tables"]["organizations"]["Update"];
type AdminClient = ReturnType<typeof createAdminClient>;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("[stripe-webhook] Missing stripe-signature header.");
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 500 },
    );
  }

  // Strictly verify the event signature using the webhook signing secret.
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe-webhook] Signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.appointment_id) {
          await handleBookingCompleted(admin, session);
        } else {
          await handleCheckoutCompleted(admin, session);
        }
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleBookingCancelled(admin, session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(admin, subscription);
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
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

/**
 * Confirms an appointment after a successful booking deposit. Only transitions
 * `pending` -> `confirmed` so duplicate webhook deliveries are idempotent.
 */
async function handleBookingCompleted(
  admin: AdminClient,
  session: Stripe.Checkout.Session,
) {
  const appointmentId = session.metadata?.appointment_id;
  if (!appointmentId) return;

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;

  const { error } = await admin
    .from("appointments")
    .update({
      status: "confirmed",
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("id", appointmentId)
    .eq("status", "pending");

  if (error) {
    console.error(
      `[stripe-webhook] Failed to confirm appointment ${appointmentId}:`,
      error,
    );
    throw new Error(error.message);
  }

  // Best-effort: send the customer a confirmation email after payment.
  try {
    const details = await getAppointmentDetails(appointmentId);
    if (details) {
      await sendBookingConfirmationEmail({
        to: details.appointment.customer_email,
        organizationName: details.organizationName,
        serviceName: details.serviceName,
        appointmentStart: details.appointment.start_time,
        appointmentEnd: details.appointment.end_time,
        customerName: details.appointment.customer_name,
        customerEmail: details.appointment.customer_email,
        customerPhone: details.appointment.customer_phone,
      });
    }
  } catch (emailError) {
    console.error(
      `[stripe-webhook] Failed to send booking confirmation for appointment ${appointmentId}:`,
      emailError,
    );
  }
}

/**
 * Releases a time slot by cancelling a still-pending appointment when its
 * Stripe Checkout session expires or its async payment fails.
 */
async function handleBookingCancelled(
  admin: AdminClient,
  session: Stripe.Checkout.Session,
) {
  const appointmentId = session.metadata?.appointment_id;
  if (!appointmentId) return;

  const { error } = await admin
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("status", "pending");

  if (error) {
    console.error(
      `[stripe-webhook] Failed to cancel appointment ${appointmentId}:`,
      error,
    );
    throw new Error(error.message);
  }
}

async function handleCheckoutCompleted(
  admin: AdminClient,
  session: Stripe.Checkout.Session,
) {
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;
  if (!subscriptionId) {
    console.warn("[stripe-webhook] checkout.session.completed without a subscription id.");
    return;
  }

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  await persistSubscription(admin, subscription, session.client_reference_id);
}

async function syncSubscription(
  admin: AdminClient,
  subscription: Stripe.Subscription,
) {
  await persistSubscription(admin, subscription, null);
}

async function persistSubscription(
  admin: AdminClient,
  subscription: Stripe.Subscription,
  organizationId: string | null,
) {
  const price = subscription.items.data[0]?.price;
  let planId: string | null = null;
  if (typeof price === "string") {
    planId = price;
  } else if (price) {
    planId = price.id;
  }

  const currentPeriodEnd = subscription.items.data[0]?.current_period_end ?? null;

  const update: OrganizationUpdate = {
    stripe_customer_id: String(subscription.customer),
    stripe_subscription_id: subscription.id,
    plan_id: planId,
    subscription_status: subscription.status,
    current_period_end: currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : null,
  };

  const { error } = organizationId
    ? await admin
        .from("organizations")
        .update(update)
        .eq("id", organizationId)
    : await admin
        .from("organizations")
        .update(update)
        .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error(
      `[stripe-webhook] Failed to persist subscription ${subscription.id}:`,
      error,
    );
    throw new Error(error.message);
  }
}

