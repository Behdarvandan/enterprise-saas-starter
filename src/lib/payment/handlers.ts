import { createAdminClient } from "@/lib/supabase/admin";
import { getAppointmentDetails } from "@/lib/booking";
import { sendBookingConfirmationEmail } from "@/lib/email";
import type { Database } from "@/types/database";

type AppointmentUpdate = Database["public"]["Tables"]["appointments"]["Update"];
type OrganizationUpdate = Database["public"]["Tables"]["organizations"]["Update"];

/**
 * A provider-agnostic snapshot of a subscription. The Stripe adapter maps a
 * `Stripe.Subscription` onto this shape before persisting it so the shared
 * handler never has to depend on the Stripe SDK types.
 */
export interface SubscriptionSnapshot {
  customerId: string;
  subscriptionId: string;
  planId: string | null;
  status: string;
  currentPeriodEnd: string | null;
}

/**
 * Confirms an appointment after a successful deposit payment. The update is
 * scoped to `pending` rows only, which makes duplicate webhook deliveries
 * idempotent: the second delivery matches zero rows and is skipped.
 *
 * @returns `true` when the appointment transitioned, `false` when it had
 * already been processed.
 */
export async function confirmAppointmentById(
  appointmentId: string,
  paymentReference?: string | null,
): Promise<boolean> {
  const admin = createAdminClient();

  const update: AppointmentUpdate = { status: "confirmed" };
  if (paymentReference) {
    update.stripe_payment_intent_id = paymentReference;
  }

  const { error, data: updated } = await admin
    .from("appointments")
    .update(update)
    .eq("id", appointmentId)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error(
      `[payment-webhook] Failed to confirm appointment ${appointmentId}:`,
      error,
    );
    throw new Error(error.message);
  }

  if (!updated || updated.length === 0) {
    console.info(
      `[payment-webhook] Duplicate payment approval for appointment ${appointmentId} — already processed, skipping confirmation email.`,
    );
    return false;
  }

  // Best-effort: notify the customer about the confirmed booking.
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
      `[payment-webhook] Failed to send booking confirmation for appointment ${appointmentId}:`,
      emailError,
    );
  }

  return true;
}

/**
 * Releases a time slot by cancelling a still-pending appointment. Scoped to
 * `pending` rows for idempotency, mirroring the Stripe expiry flow.
 */
export async function cancelAppointmentById(
  appointmentId: string,
): Promise<boolean> {
  const admin = createAdminClient();

  const { error, data: updated } = await admin
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error(
      `[payment-webhook] Failed to cancel appointment ${appointmentId}:`,
      error,
    );
    throw new Error(error.message);
  }

  if (!updated || updated.length === 0) {
    console.info(
      `[payment-webhook] Duplicate cancellation for appointment ${appointmentId} — already processed, skipping.`,
    );
    return false;
  }

  return true;
}

/**
 * Marks an organization subscription as active after a successful one-time
 * plan payment (used by gateways such as PayTR that have no native
 * subscription concept). The `.neq` guard keeps duplicate deliveries
 * idempotent.
 */
export async function activateOrganizationById(
  organizationId: string,
): Promise<boolean> {
  const admin = createAdminClient();

  const { error, data: updated } = await admin
    .from("organizations")
    .update({ subscription_status: "active" })
    .eq("id", organizationId)
    .neq("subscription_status", "active")
    .select("id");

  if (error) {
    console.error(
      `[payment-webhook] Failed to activate organization ${organizationId}:`,
      error,
    );
    throw new Error(error.message);
  }

  if (!updated || updated.length === 0) {
    console.info(
      `[payment-webhook] Duplicate payment approval for organization ${organizationId} — subscription already active, skipping.`,
    );
    return false;
  }

  return true;
}

/**
 * Persists a subscription snapshot to the organization row. When an explicit
 * `organizationId` is provided (checkout completion), the update targets that
 * row directly; otherwise it resolves the row through the provider
 * subscription id (subscription lifecycle events).
 */
export async function persistSubscriptionSnapshot(
  snapshot: SubscriptionSnapshot,
  organizationId?: string | null,
): Promise<void> {
  const admin = createAdminClient();

  const update: OrganizationUpdate = {
    stripe_customer_id: snapshot.customerId,
    stripe_subscription_id: snapshot.subscriptionId,
    plan_id: snapshot.planId,
    subscription_status: snapshot.status,
    current_period_end: snapshot.currentPeriodEnd,
  };

  const { error } = organizationId
    ? await admin
        .from("organizations")
        .update(update)
        .eq("id", organizationId)
    : await admin
        .from("organizations")
        .update(update)
        .eq("stripe_subscription_id", snapshot.subscriptionId);

  if (error) {
    console.error(
      `[payment-webhook] Failed to persist subscription ${snapshot.subscriptionId}:`,
      error,
    );
    throw new Error(error.message);
  }
}
