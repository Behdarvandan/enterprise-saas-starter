import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserMembership } from "@/lib/team";
import { formatAppointmentDate, formatAppointmentTime } from "@/lib/utils";
import type { Appointment, AppointmentStatus } from "@/types";
import Card from "@/components/ui/Card";
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

const statusStyles: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-slate-100 text-slate-700",
};

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const { status, date } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const membership = await getUserMembership(user.id);
  if (!membership) redirect("/dashboard");

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

  const now = new Date().toISOString();
  const list = appointments ?? [];

  const upcoming = list.filter(
    (appointment) =>
      appointment.start_time >= now &&
      appointment.status !== "cancelled" &&
      appointment.status !== "completed",
  );
  const past = list.filter((appointment) => !upcoming.includes(appointment));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage upcoming and past appointments.
        </p>
      </div>

      <Card className="mb-6 p-6">
        <form
          method="get"
          action="/dashboard/bookings"
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="status"
              className="block text-xs font-medium text-slate-500"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
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
            <label
              htmlFor="date"
              className="block text-xs font-medium text-slate-500"
            >
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={date ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Filter
          </button>
          {(status || date) && (
            <Link
              href="/dashboard/bookings"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Reset
            </Link>
          )}
        </form>
      </Card>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Upcoming ({upcoming.length})
          </h2>
          {upcoming.length === 0 ? (
            <Card className="p-6">
              <p className="text-sm text-slate-500">No upcoming appointments.</p>
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

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Past ({past.length})
          </h2>
          {past.length === 0 ? (
            <Card className="p-6">
              <p className="text-sm text-slate-500">No past appointments.</p>
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
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">
              {appointment.customer_name}
            </p>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}
            >
              {status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{serviceName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatAppointmentDate(appointment.start_time)} at{" "}
            {formatAppointmentTime(appointment.start_time)} –{" "}
            {formatAppointmentTime(appointment.end_time)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {appointment.customer_email}
            {appointment.customer_phone
              ? ` · ${appointment.customer_phone}`
              : ""}
          </p>
        </div>

        {isActive && <AppointmentActions appointmentId={appointment.id} />}
      </div>
    </Card>
  );
}
