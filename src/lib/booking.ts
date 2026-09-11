import { createAdminClient } from "@/lib/supabase/admin";
import type { Appointment } from "@/types";

/**
 * Booking helpers for the Appointment & Reservation System.
 *
 * All functions use the service-role client because the customer-facing flow
 * is anonymous; tenant isolation is enforced by passing an explicit
 * `organization_id` on every query and insert.
 */

const DEFAULT_SLOT_STEP_MINUTES = 30;

export interface BookingSlot {
  /** ISO-8601 start timestamp. */
  startTime: string;
  /** ISO-8601 end timestamp. */
  endTime: string;
}

export interface GetAvailableSlotsInput {
  organizationId: string;
  serviceId: string;
  /** Local calendar day in `YYYY-MM-DD` format. */
  date: string;
  /** Step between consecutive slot start times, in minutes. */
  slotStepMinutes?: number;
}

export interface CreatePendingAppointmentInput {
  organizationId: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  /** ISO-8601 start timestamp. */
  startTime: string;
}

/** Converts a Postgres `time` value ("HH:MM[:SS]") to minutes since midnight. */
function minutesOfDay(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Returns every bookable time slot for a service on a given day, taking the
 * organization's weekly `availability_slots` and its existing (non-cancelled)
 * appointments into account.
 */
export async function getAvailableSlots({
  organizationId,
  serviceId,
  date,
  slotStepMinutes = DEFAULT_SLOT_STEP_MINUTES,
}: GetAvailableSlotsInput): Promise<BookingSlot[]> {
  const admin = createAdminClient();

  const { data: service, error: serviceError } = await admin
    .from("services")
    .select("id, duration_minutes, is_active")
    .eq("id", serviceId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (serviceError) throw new Error(serviceError.message);
  if (!service || !service.is_active) {
    throw new Error("Service not found or inactive.");
  }

  // Day-of-week using UTC (0 = Sunday ... 6 = Saturday), matching the
  // `availability_slots.day_of_week` convention.
  const dayOfWeek = new Date(`${date}T00:00:00.000Z`).getUTCDay();

  const { data: windows, error: windowsError } = await admin
    .from("availability_slots")
    .select("start_time, end_time")
    .eq("organization_id", organizationId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true);

  if (windowsError) throw new Error(windowsError.message);
  if (!windows?.length) return [];

  // Existing non-cancelled appointments overlapping the requested day.
  const dayStart = new Date(`${date}T00:00:00.000Z`).toISOString();
  const nextDay = new Date(`${date}T00:00:00.000Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const dayEnd = nextDay.toISOString();

  const { data: appointments, error: appointmentsError } = await admin
    .from("appointments")
    .select("start_time, end_time")
    .eq("organization_id", organizationId)
    .neq("status", "cancelled")
    .lt("start_time", dayEnd)
    .gt("end_time", dayStart);

  if (appointmentsError) throw new Error(appointmentsError.message);

  const blocked = (appointments ?? []).map((appointment) => ({
    start: Date.parse(appointment.start_time),
    end: Date.parse(appointment.end_time),
  }));

  const dayTimestamp = Date.parse(dayStart);
  const duration = service.duration_minutes;
  const step = slotStepMinutes > 0 ? slotStepMinutes : DEFAULT_SLOT_STEP_MINUTES;
  const slots: BookingSlot[] = [];

  for (const window of windows) {
    const windowStart = minutesOfDay(window.start_time);
    const windowEnd = minutesOfDay(window.end_time);

    for (
      let cursor = windowStart;
      cursor + duration <= windowEnd;
      cursor += step
    ) {
      const start = dayTimestamp + cursor * 60_000;
      const end = dayTimestamp + (cursor + duration) * 60_000;

      const overlaps = blocked.some((b) => start < b.end && b.start < end);
      if (overlaps) continue;

      slots.push({
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
      });
    }
  }

  return slots;
}

/**
 * Creates a `pending` appointment prior to Stripe Checkout initiation. The
 * end time is derived from the service duration so clients cannot book a
 * mismatched length. The database overlap trigger rejects double-bookings.
 */
export async function createPendingAppointment({
  organizationId,
  serviceId,
  customerName,
  customerEmail,
  customerPhone,
  startTime,
}: CreatePendingAppointmentInput): Promise<Appointment> {
  const admin = createAdminClient();

  const { data: service, error: serviceError } = await admin
    .from("services")
    .select("id, duration_minutes, is_active")
    .eq("id", serviceId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (serviceError) throw new Error(serviceError.message);
  if (!service || !service.is_active) {
    throw new Error("Service not found or inactive.");
  }

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid start time.");
  }

  const end = new Date(start.getTime() + service.duration_minutes * 60_000);

  const { data: appointment, error } = await admin
    .from("appointments")
    .insert({
      organization_id: organizationId,
      service_id: serviceId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone ?? null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    // P0001 is raised by the overlap trigger when the slot is already taken.
    if (error.code === "P0001") {
      throw new Error("The selected time is no longer available.");
    }
    throw new Error(error.message);
  }

  return appointment as Appointment;
}
