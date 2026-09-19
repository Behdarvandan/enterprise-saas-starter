"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireMembershipResult } from "@/lib/auth";
import { firstIssueMessage } from "@/lib/validation";
import type { Database } from "@/types/database";

export type BookingActionResult = { error?: string; success?: boolean };

/** Org-scoped appointment lookup shared by `cancelAppointment` and `rescheduleAppointment`. */
function getOrgScopedAppointment(
  supabase: SupabaseClient<Database>,
  appointmentId: string,
  organizationId: string,
) {
  return supabase
    .from("appointments")
    .select("id, service_id, status")
    .eq("id", appointmentId)
    .eq("organization_id", organizationId)
    .maybeSingle();
}

// `newStartTime` comes from a `<input type="datetime-local">`, which produces
// "YYYY-MM-DDTHH:mm" (no seconds, no timezone).
const rescheduleInputSchema = z.object({
  appointmentId: z.string().uuid("invalid_id"),
  newStartTime: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
      "invalid_date",
    ),
});

export async function cancelAppointment(
  appointmentId: string,
): Promise<BookingActionResult> {
  const t = await getTranslations("dashboard.bookings.errors");
  const auth = await requireMembershipResult();
  if ("error" in auth) return auth;
  const { supabase, membership } = auth;

  const { data: appointment } = await getOrgScopedAppointment(
    supabase,
    appointmentId,
    membership.organizationId,
  );

  if (!appointment) return { error: t("notFound") };
  if (appointment.status === "cancelled") {
    return { error: t("alreadyCancelled") };
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("organization_id", membership.organizationId);

  if (error) return { error: t("generic") };

  revalidatePath("/dashboard/bookings");
  return { success: true };
}

export async function rescheduleAppointment(
  appointmentId: string,
  newStartTime: string,
): Promise<BookingActionResult> {
  const t = await getTranslations("dashboard.bookings.errors");
  const parsedInput = rescheduleInputSchema.safeParse({
    appointmentId,
    newStartTime,
  });
  if (!parsedInput.success) {
    return { error: firstIssueMessage(parsedInput.error) === "invalid_id" ? t("invalidId") : t("invalidDate") };
  }

  const auth = await requireMembershipResult();
  if ("error" in auth) return auth;
  const { supabase, membership } = auth;

  // Anchor the wall-clock value to UTC to stay consistent with the booking
  // engine. The regex above rejects malformed strings; this still guards
  // against calendar-invalid ones the regex can't catch (e.g. month 13).
  const newStart = new Date(`${parsedInput.data.newStartTime}:00Z`);
  if (Number.isNaN(newStart.getTime())) {
    return { error: t("invalidDate") };
  }
  if (newStart <= new Date()) {
    return { error: t("mustBeFuture") };
  }

  const { data: appointment } = await getOrgScopedAppointment(
    supabase,
    appointmentId,
    membership.organizationId,
  );

  if (!appointment) return { error: t("notFound") };
  if (appointment.status === "cancelled" || appointment.status === "completed") {
    return { error: t("cannotReschedule") };
  }

  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", appointment.service_id)
    .eq("organization_id", membership.organizationId)
    .maybeSingle();

  if (!service) return { error: t("serviceNotFound") };

  const newEnd = new Date(
    newStart.getTime() + service.duration_minutes * 60_000,
  );

  const { error } = await supabase
    .from("appointments")
    .update({
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString(),
    })
    .eq("id", appointmentId)
    .eq("organization_id", membership.organizationId);

  if (error) {
    if (error.code === "P0001") {
      return { error: t("conflict") };
    }
    return { error: t("generic") };
  }

  revalidatePath("/dashboard/bookings");
  return { success: true };
}
