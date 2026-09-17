import { Link } from "@/i18n/navigation";
import { CalendarX2 } from "lucide-react";
import { requireMembership } from "@/lib/auth";
import { appointmentStatusTone, formatAppointmentDate, formatAppointmentTime } from "@/lib/utils";
import type { Appointment, AppointmentStatus } from "@/types";
import { Card } from "@/components/ui/card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import AppointmentActions from "./AppointmentActions";

interface BookingsPageProps {
  searchParams: Promise<{ status?: string; date?: string }>;
}

const VALID_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const { status, date } = await searchParams;

  const { supabase, membership } = await requireMembership();
  const organizationId = membership.organizationId;

  let query = supabase
    .from("appointments")
    .select("*")
    .eq("organization_id", organizationId)
    .order("start_time", { ascending: true });

  if (status && VALID_STATUSES.includes(status as AppointmentStatus)) {
    query = query.eq("status", status as AppointmentStatus);
  }

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const dayStart = `${date}T00:00:00.000Z`;
    const nextDay = new Date(`${date}T00:00:00.000Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    query = query
      .gte("start_time", dayStart)
      .lt("start_time", nextDay.toISOString());
  }

  const { data: appointments } = await query;

  const { data: services } = await supabase
    .from("services")
    .select("id, name")
    .eq("organization_id", organizationId);

  const serviceMap = new Map(
    (services ?? []).map((service) => [service.id, service.name]),
  );
  const hasServices = (services ?? []).length > 0;

  const now = new Date().toISOString();
  const list = appointments ?? [];

  const upcoming = list.filter(
    (appointment) =>
      appointment.start_time >= now &&
      appointment.status !== "cancelled" &&
      appointment.status !== "completed",
  );
  const past = list.filter((appointment) => !upcoming.includes(appointment));
  const isFiltered = Boolean(status || date);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-primary">Bookings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          View and manage upcoming and past appointments.
        </p>
      </div>

      <Card className="animate-reveal-up mb-6 p-6">
        <form
          method="get"
          action="/dashboard/bookings"
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label htmlFor="status" className="block text-xs font-medium text-ink-muted">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status ?? ""}
              className="mt-1 w-full rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-violet-dim"
            >
              <option value="">All statuses</option>
              {VALID_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="date" className="block text-xs font-medium text-ink-muted">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={date ?? ""}
              className="mt-1 w-full rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-violet-dim"
            />
          </div>
          <button
            type="submit"
            className="rounded-interactive bg-violet px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet/90"
          >
            Filter
          </button>
          {isFiltered && (
            <Link
              href="/dashboard/bookings"
              className="rounded-interactive px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-raised"
            >
              Reset
            </Link>
          )}
        </form>
      </Card>

      <div className="space-y-6">
        <section className="animate-reveal-up" style={{ animationDelay: "60ms" }}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Upcoming ({upcoming.length})
          </h2>
          {upcoming.length === 0 ? (
            <Card>
              <EmptyState
                icon={CalendarX2}
                title={isFiltered ? "No appointments match this filter" : "No upcoming appointments"}
                description={
                  isFiltered
                    ? "Try a different status or date, or reset the filter."
                    : hasServices
                      ? "Share your booking link so customers can put themselves on the calendar."
                      : "This organization has no bookable services configured yet, so nothing can be scheduled."
                }
                action={
                  isFiltered ? (
                    <Link
                      href="/dashboard/bookings"
                      className="mt-2 text-sm font-semibold text-violet-dim hover:text-violet"
                    >
                      Reset filter
                    </Link>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {upcoming.map((appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  serviceName={serviceMap.get(appointment.service_id) ?? "Service"}
                />
              ))}
            </div>
          )}
        </section>

        <section className="animate-reveal-up" style={{ animationDelay: "120ms" }}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Past ({past.length})
          </h2>
          {past.length === 0 ? (
            <Card>
              <EmptyState
                icon={CalendarX2}
                title="No past appointments"
                description="Completed and cancelled bookings will show up here once they happen."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {past.map((appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  serviceName={serviceMap.get(appointment.service_id) ?? "Service"}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function AppointmentRow({
  appointment,
  serviceName,
}: {
  appointment: Appointment;
  serviceName: string;
}) {
  const status = appointment.status;
  const isActive = status === "confirmed" || status === "pending";

  return (
    <Card variant="item" className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink-primary">
              {appointment.customer_name}
            </p>
            <Badge tone={appointmentStatusTone[status]}>{status}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-muted">{serviceName}</p>
          <p className="mt-1 font-mono text-xs text-ink-muted">
            {formatAppointmentDate(appointment.start_time)} at{" "}
            {formatAppointmentTime(appointment.start_time)} –{" "}
            {formatAppointmentTime(appointment.end_time)}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {appointment.customer_email}
            {appointment.customer_phone ? ` · ${appointment.customer_phone}` : ""}
          </p>
        </div>

        {isActive && <AppointmentActions appointmentId={appointment.id} />}
      </div>
    </Card>
  );
}
