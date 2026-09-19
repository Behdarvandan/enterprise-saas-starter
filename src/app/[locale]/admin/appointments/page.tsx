import { CalendarX2 } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import AppointmentStatusBadge from "@/components/dashboard/AppointmentStatusBadge";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import EmptyState from "@/components/ui/EmptyState";
import { requireOperatorAdmin, getOperatorOrganizationId } from "@/lib/operator";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Reads the operator's own booking calendar (the same `appointments` table
 * the product sells to tenants — the operator organization is itself a
 * tenant of its own product, per `supabase/seed-operator.sql`). A simple
 * upcoming/past list, mirroring `dashboard/bookings`, rather than a
 * weekly-calendar grid — a larger dedicated UI effort better scoped on its
 * own once this data is actually flowing.
 */
export default async function AdminAppointmentsPage() {
  const { supabase } = await requireOperatorAdmin();
  const operatorOrgId = await getOperatorOrganizationId();
  const [t, format] = await Promise.all([getTranslations("admin.appointments"), getFormatter()]);

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

  const day = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium", numberingSystem: "latn" });
  const time = (iso: string) => format.dateTime(new Date(iso), { timeStyle: "short", numberingSystem: "latn" });

  function Row({ appointment }: { appointment: Appointment }) {
    return (
      <Card
        variant="item"
        className={cn("border-s-2 p-4 sm:p-5", appointment.status === "cancelled" ? "border-s-red-400" : "border-s-amber-500")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-100">{appointment.customer_name}</p>
          <AppointmentStatusBadge status={appointment.status} />
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {serviceNameById.get(appointment.service_id) ?? t("fallbackService")}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {t("when", { date: day(appointment.start_time), start: time(appointment.start_time), end: time(appointment.end_time) })}
        </p>
      </Card>
    );
  }

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader title={t("title")} description={t("description")} />

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-tight text-slate-100">{t("upcoming", { count: upcoming.length })}</h2>
        {upcoming.length === 0 ? (
          <Card>
            <EmptyState icon={CalendarX2} title={t("emptyUpcomingTitle")} description={t("emptyUpcomingDescription")} />
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appointment) => (
              <Row key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-tight text-slate-100">{t("past", { count: past.length })}</h2>
        {past.length === 0 ? (
          <Card>
            <EmptyState icon={CalendarX2} title={t("emptyPastTitle")} description={t("emptyPastDescription")} />
          </Card>
        ) : (
          <div className="space-y-3">
            {past.map((appointment) => (
              <Row key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
