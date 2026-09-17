import { CalendarX2 } from "lucide-react";
import { requireOperatorAdmin, getOperatorOrganizationId } from "@/lib/operator";
import { appointmentStatusTone, formatAppointmentDate, formatAppointmentTime } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import type { Appointment, AppointmentStatus } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Reads the operator's own booking calendar (the same `appointments` table
 * the product sells to tenants — the operator organization is itself a
 * tenant of its own product, per `supabase/seed-operator.sql`). A simple
 * upcoming/past list, mirroring `dashboard/bookings`, rather than the
 * brief's weekly-calendar-grid mockup — that's a larger dedicated UI effort
 * better scoped on its own once this data is actually flowing.
 */
export default async function AdminAppointmentsPage() {
  const { supabase } = await requireOperatorAdmin();
  const operatorOrgId = await getOperatorOrganizationId();

  const { data: appointments } = operatorOrgId
    ? await supabase
        .from("appointments")
        .select("*")
        .eq("organization_id", operatorOrgId)
        .order("start_time", { ascending: true })
    : { data: [] };

  const { data: services } = operatorOrgId
    ? await supabase.from("services").select("id, name").eq("organization_id", operatorOrgId)
    : { data: [] };
  const serviceNameById = new Map((services ?? []).map((s) => [s.id, s.name]));

  const now = new Date().toISOString();
  const list = (appointments ?? []) as Appointment[];
  const upcoming = list.filter((a) => a.start_time >= now && a.status !== "cancelled");
  const past = list.filter((a) => !upcoming.includes(a));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-semibold text-ink-primary">Randevular</h1>
      <p className="mt-1 text-sm text-ink-muted">
        İşletmenizin kendi rezervasyon takvimi — danışma görüşmeleri ve teslim toplantıları.
      </p>

      <div className="mt-8 space-y-6">
        <section className="animate-reveal-up">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Yaklaşan ({upcoming.length})
          </h2>
          {upcoming.length === 0 ? (
            <div className="rounded-interactive border border-subtle bg-surface">
              <EmptyState
                icon={CalendarX2}
                title="Yaklaşan randevu yok"
                description="Yeni bir randevu alındığında burada görünecek."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  serviceName={serviceNameById.get(appointment.service_id) ?? "Hizmet"}
                />
              ))}
            </div>
          )}
        </section>

        <section className="animate-reveal-up" style={{ animationDelay: "60ms" }}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Geçmiş ({past.length})
          </h2>
          {past.length === 0 ? (
            <div className="rounded-interactive border border-subtle bg-surface">
              <EmptyState
                icon={CalendarX2}
                title="Geçmiş randevu yok"
                description="Tamamlanan ve iptal edilen randevular burada listelenecek."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {past.map((appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  serviceName={serviceNameById.get(appointment.service_id) ?? "Hizmet"}
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
  return (
    <div
      className={`rounded-interactive border-l-2 border-subtle bg-surface p-4 transition-shadow duration-200 hover:shadow-md hover:shadow-gold/10 sm:p-5 ${
        appointment.status === "cancelled" ? "border-l-status-error" : "border-l-status-warn"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink-primary">{appointment.customer_name}</p>
            <Badge tone={appointmentStatusTone[appointment.status as AppointmentStatus]}>
              {appointment.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-ink-muted">{serviceName}</p>
          <p className="mt-1 font-mono text-xs text-ink-muted">
            {formatAppointmentDate(appointment.start_time)} ·{" "}
            {formatAppointmentTime(appointment.start_time)}–
            {formatAppointmentTime(appointment.end_time)}
          </p>
        </div>
      </div>
    </div>
  );
}
