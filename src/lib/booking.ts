import { createAnonClient } from "@/lib/supabase/anon";
import type { Appointment } from "@/types";

/**
 * Booking helpers for the Appointment & Reservation System.
 *
 * The customer-facing flow is anonymous, so every function here runs on the
 * anon-key client and reaches tenant-scoped tables only through
 * `SECURITY DEFINER` RPCs (see `supabase/migrations/20261113000000_booking_anon_rpcs.sql`)
 * that take `organization_id` as an explicit parameter and enforce it as a
 * hard SQL predicate. Unlike the service-role client this replaced, a bug in
 * this file's TypeScript can no longer produce a cross-tenant read/write on
 * its own — the anon key has no table-level grants, only EXECUTE on these
 * specific functions.
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
  /** Optional device details (e.g. "iPhone 13 Pro, 128GB"). Repair-shop tenants only. */
  deviceInfo?: string | null;
  /** Optional free-text description of the customer's issue. Repair-shop tenants only. */
  issueDescription?: string | null;
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
  const anon = createAnonClient();

  const { data: service, error: serviceError } = await anon.rpc(
    "get_bookable_service",
    { p_organization_id: organizationId, p_service_id: serviceId },
  );

  if (serviceError) throw new Error(serviceError.message);
  if (!service) {
    throw new Error("Service not found or inactive.");
  }

  // Day-of-week using UTC (0 = Sunday ... 6 = Saturday), matching the
  // `availability_slots.day_of_week` convention.
  const dayOfWeek = new Date(`${date}T00:00:00.000Z`).getUTCDay();

  const { data: windows, error: windowsError } = await anon.rpc(
    "get_availability_windows",
    { p_organization_id: organizationId, p_day_of_week: dayOfWeek },
  );

  if (windowsError) throw new Error(windowsError.message);
  if (!windows?.length) return [];

  // Existing non-cancelled appointments overlapping the requested day.
  const dayStart = new Date(`${date}T00:00:00.000Z`).toISOString();
  const nextDay = new Date(`${date}T00:00:00.000Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const dayEnd = nextDay.toISOString();

  const { data: appointments, error: appointmentsError } = await anon.rpc(
    "get_appointment_conflicts",
    {
      p_organization_id: organizationId,
      p_range_start: dayStart,
      p_range_end: dayEnd,
    },
  );

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
 * Creates a `pending` appointment prior to Stripe/PayTR checkout initiation.
 * The end time is derived from the service duration inside the
 * `create_pending_appointment` function so clients cannot book a mismatched
 * length. The database overlap trigger rejects double-bookings.
 */
export async function createPendingAppointment({
  organizationId,
  serviceId,
  customerName,
  customerEmail,
  customerPhone,
  deviceInfo,
  issueDescription,
  startTime,
}: CreatePendingAppointmentInput): Promise<Appointment> {
  const anon = createAnonClient();

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid start time.");
  }

  const { data: appointment, error } = await anon.rpc(
    "create_pending_appointment",
    {
      p_organization_id: organizationId,
      p_service_id: serviceId,
      p_customer_name: customerName,
      p_customer_email: customerEmail,
      p_customer_phone: customerPhone ?? null,
      p_device_info: deviceInfo ?? null,
      p_issue_description: issueDescription ?? null,
      p_start_time: start.toISOString(),
    },
  );

  if (error) {
    // P0001 is raised by the overlap trigger when the slot is already taken;
    // P0002 is raised by the function itself when the service lookup fails.
    if (error.code === "P0001") {
      throw new Error("The selected time is no longer available.");
    }
    if (error.code === "P0002") {
      throw new Error("Service not found or inactive.");
    }
    throw new Error(error.message);
  }

  return appointment;
}

/**
 * Immediately confirms a still-pending appointment for free (price = 0)
 * services, which skip the payment step entirely. Scoped to `pending` rows
 * for idempotency. Returns `null` if the appointment was already confirmed
 * (or doesn't belong to the given organization).
 */
export async function confirmPendingAppointment(
  appointmentId: string,
  organizationId: string,
): Promise<Appointment | null> {
  const anon = createAnonClient();

  const { data, error } = await anon.rpc("confirm_pending_appointment", {
    p_organization_id: organizationId,
    p_appointment_id: appointmentId,
  });

  if (error) throw new Error(error.message);
  return data ?? null;
}

export interface AppointmentDetails {
  appointment: Appointment;
  serviceName: string;
  organizationName: string;
}

/**
 * Resolves an appointment together with its service and organization names
 * for confirmation pages and email notifications. `organizationId` is
 * mandatory: the `get_appointment_details` RPC enforces it as a hard filter,
 * so a guessed or leaked `appointmentId` alone is never enough to read
 * another tenant's booking.
 */
export async function getAppointmentDetails(
  appointmentId: string,
  organizationId: string,
): Promise<AppointmentDetails | null> {
  const anon = createAnonClient();

  const { data, error } = await anon
    .rpc("get_appointment_details", {
      p_appointment_id: appointmentId,
      p_organization_id: organizationId,
    })
    .maybeSingle();

  if (error || !data) return null;

  return {
    appointment: data.appointment,
    serviceName: data.service_name,
    organizationName: data.organization_name,
  };
}
