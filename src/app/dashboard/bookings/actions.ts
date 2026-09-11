"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserMembership } from "@/lib/team";

export type BookingActionResult = { error?: string; success?: boolean };

export async function cancelAppointment(
  appointmentId: string,
): Promise<BookingActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const membership = await getUserMembership(user.id);
  if (!membership) return { error: "You do not belong to an organization." };

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, status")
    .eq("id", appointmentId)
    .eq("organization_id", membership.organizationId)
    .maybeSingle();

  if (!appointment) return { error: "Appointment not found." };
  if (appointment.status === "cancelled") {
    return { error: "This appointment is already cancelled." };
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("organization_id", membership.organizationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/bookings");
  return { success: true };
}

export async function rescheduleAppointment(
  appointmentId: string,
  newStartTime: string,
): Promise<BookingActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const membership = await getUserMembership(user.id);
  if (!membership) return { error: "You do not belong to an organization." };

  // datetime-local inputs produce "YYYY-MM-DDTHH:mm". Anchor the wall-clock
  // value to UTC to stay consistent with the booking engine.
  const newStart = new Date(`${newStartTime}:00Z`);
  if (Number.isNaN(newStart.getTime())) {
    return { error: "Please provide a valid date and time." };
  }
  if (newStart <= new Date()) {
    return { error: "The new time must be in the future." };
  }

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, service_id, status")
    .eq("id", appointmentId)
    .eq("organization_id", membership.organizationId)
    .maybeSingle();

  if (!appointment) return { error: "Appointment not found." };
  if (appointment.status === "cancelled" || appointment.status === "completed") {
    return { error: "This appointment can no longer be rescheduled." };
  }

  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", appointment.service_id)
    .eq("organization_id", membership.organizationId)
    .maybeSingle();

  if (!service) return { error: "Service not found." };

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
      return { error: "The selected time conflicts with an existing booking." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/bookings");
  return { success: true };
}
