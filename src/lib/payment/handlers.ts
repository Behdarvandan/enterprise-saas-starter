import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppointmentDetails } from "@/lib/booking";
import { sendBookingConfirmationEmail } from "@/lib/email";
import type { Database } from "@/types/database";

type AppointmentUpdate = Database["public"]["Tables"]["appointments"]["Update"];
type OrganizationUpdate = Database["public"]["Tables"]["organizations"]["Update"];

/**
 * Which Ops Crew skills (see pasargad-core's packages/graph/tools.py /
 * crew_config.enabled_skills) a plan unlocks. Unknown/missing plan ids fall
 * back to the free "rag_search"-only tier.
 */
const PLAN_ENABLED_SKILLS: Record<string, string[]> = {
  starter: ["rag_search"],
  pro: ["rag_search", "calendar_booking"],
  enterprise: ["rag_search", "calendar_booking"],
};
const DEFAULT_ENABLED_SKILLS = ["rag_search"];

/**
 * Idempotently syncs `tenant_configs.crew_config.enabled_skills` to match the
 * organization's current plan. Versioned like pasargad-core expects
 * (state.py::load_tenant_config reads the highest-version active row): a
 * no-op when the skill set is already correct, otherwise deactivates the
 * current row and inserts the next version with the rest of `config`
 * preserved (system_prompt, rag_params, etc.).
 */
async function syncTenantConfigSkills(
  organizationId: string,
  planId: string | null,
): Promise<void> {
  const admin = createAdminClient();
  const enabledSkills = (planId && PLAN_ENABLED_SKILLS[planId]) || DEFAULT_ENABLED_SKILLS;

  const { data: current, error: readError } = await admin
    .from("tenant_configs")
    .select("id, version, config")
    .eq("tenant_id", organizationId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (readError) {
    console.error(
      `[payment-webhook] Failed to read tenant_configs for ${organizationId}:`,
      readError,
    );
    Sentry.captureException(readError, { extra: { organizationId } });
    return;
  }

  const currentConfig = (current?.config as Record<string, unknown> | null) ?? {};
  const currentCrewConfig = (currentConfig.crew_config as Record<string, unknown> | null) ?? {};
  const currentSkills = (currentCrewConfig.enabled_skills as string[] | undefined) ?? null;

  if (current && JSON.stringify(currentSkills) === JSON.stringify(enabledSkills)) {
    return; // already in sync — idempotent no-op for duplicate webhook deliveries
  }

  const nextConfig = {
    ...currentConfig,
    crew_config: { ...currentCrewConfig, enabled_skills: enabledSkills },
  };
  const nextVersion = (current?.version ?? 0) + 1;

  if (current) {
    await admin.from("tenant_configs").update({ is_active: false }).eq("id", current.id);
  }

  const { error: insertError } = await admin.from("tenant_configs").insert({
    tenant_id: organizationId,
    version: nextVersion,
    config: nextConfig,
    is_active: true,
  } satisfies Database["public"]["Tables"]["tenant_configs"]["Insert"]);

  if (insertError) {
    console.error(
      `[payment-webhook] Failed to sync enabled_skills for ${organizationId}:`,
      insertError,
    );
    Sentry.captureException(insertError, { extra: { organizationId, enabledSkills } });
  }
}

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
  organizationId?: string | null,
): Promise<boolean> {
  const admin = createAdminClient();

  const update: AppointmentUpdate = { status: "confirmed" };
  if (paymentReference) {
    update.provider_payment_intent_id = paymentReference;
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
    Sentry.captureException(error, { extra: { appointmentId } });
    throw new Error(error.message);
  }

  if (!updated || updated.length === 0) {
    console.info(
      `[payment-webhook] Duplicate payment approval for appointment ${appointmentId} — already processed, skipping confirmation email.`,
    );
    return false;
  }

  // Best-effort: notify the customer about the confirmed booking.
  // `getAppointmentDetails` requires an organization id (it's a hard filter
  // in the underlying RPC); both providers supply one today (Stripe via
  // checkout session metadata, PayTR via the merchant order id), but this
  // guard keeps a missing one from throwing instead of just skipping the email.
  try {
    const details = organizationId
      ? await getAppointmentDetails(appointmentId, organizationId)
      : null;
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
    } else if (!organizationId) {
      console.info(
        `[payment-webhook] No organization id available for appointment ${appointmentId}; skipping confirmation email.`,
      );
    }
  } catch (emailError) {
    console.error(
      `[payment-webhook] Failed to send booking confirmation for appointment ${appointmentId}:`,
      emailError,
    );
    Sentry.captureException(emailError, { extra: { appointmentId } });
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
    Sentry.captureException(error, { extra: { appointmentId } });
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
    Sentry.captureException(error, { extra: { organizationId } });
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
    provider_customer_id: snapshot.customerId,
    provider_subscription_id: snapshot.subscriptionId,
    plan_id: snapshot.planId,
    subscription_status: snapshot.status,
    current_period_end: snapshot.currentPeriodEnd,
  };

  const { error, data: updated } = organizationId
    ? await admin
        .from("organizations")
        .update(update)
        .eq("id", organizationId)
        .select("id")
    : await admin
        .from("organizations")
        .update(update)
        .eq("provider_subscription_id", snapshot.subscriptionId)
        .select("id");

  if (error) {
    console.error(
      `[payment-webhook] Failed to persist subscription ${snapshot.subscriptionId}:`,
      error,
    );
    Sentry.captureException(error, {
      extra: { subscriptionId: snapshot.subscriptionId, organizationId },
    });
    throw new Error(error.message);
  }

  // Best-effort: keep the Ops Crew's bindable skills in sync with the new
  // plan. Never fails the webhook — a sync miss self-heals on the tenant's
  // next billing event, whereas a 500 here would make the payment provider
  // retry a subscription update that already succeeded.
  const resolvedOrganizationId = organizationId ?? updated?.[0]?.id;
  if (resolvedOrganizationId) {
    await syncTenantConfigSkills(resolvedOrganizationId, snapshot.planId);
  }
}
