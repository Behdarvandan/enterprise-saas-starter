import { CalendarX2 } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import AppointmentStatusBadge from "@/components/dashboard/AppointmentStatusBadge";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Button } from "@/core/ui/primitives/button";
import { LiquidCard } from "@/components/ui/liquid/LiquidCard";
import EmptyState from "@/components/ui/EmptyState";
import { Input } from "@/core/ui/primitives/input";
import { Label } from "@/core/ui/primitives/label";
import { NativeSelect } from "@/core/ui/primitives/native-select";
import { Link } from "@/i18n/navigation";
import { requireMembership } from "@/lib/auth";
import { APPOINTMENT_STATUSES, asAppointmentStatus } from "@/lib/status";
import type { Appointment } from "@/types";
import AppointmentActions from "./AppointmentActions";

interface BookingsPageProps {
  searchParams: Promise<{ status?: string; date?: string }>;
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const { status, date } = await searchParams;
  const [t, tStatus, format] = await Promise.all([
    getTranslations("dashboard.bookings"),
    getTranslations("status.appointment"),
    getFormatter(),
  ]);

  const { supabase, membership } = await requireMembership();
  const organizationId = membership.organizationId;

  let query = supabase
    .from("appointments")
    .select("*")
    .eq("organization_id", organizationId)
    .order("start_time", { ascending: true });

  const statusFilter = status ? asAppointmentStatus(status) : null;
  if (statusFilter) query = query.eq("status", statusFilter);

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const dayStart = `${date}T00:00:00.000Z`;
    const nextDay = new Date(`${date}T00:00:00.000Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    query = query.gte("start_time", dayStart).lt("start_time", nextDay.toISOString());
  }

  const { data: appointments } = await query;

  const { data: services } = await supabase
    .from("services")
    .select("id, name")
    .eq("organization_id", organizationId);

  const serviceMap = new Map((services ?? []).map((service) => [service.id, service.name]));
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

  // Appointments are anchored to UTC by the booking engine (see request.ts).
  const formatDay = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "full", numberingSystem: "latn" });
  const formatTime = (iso: string) => format.dateTime(new Date(iso), { timeStyle: "short", numberingSystem: "latn" });

  function AppointmentRow({ appointment }: { appointment: Appointment }) {
    const isActive = appointment.status === "confirmed" || appointment.status === "pending";
    return (
      <LiquidCard variant="item" className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{appointment.customer_name}</p>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {serviceMap.get(appointment.service_id) ?? t("fallbackService")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("when", {
                date: formatDay(appointment.start_time),
                start: formatTime(appointment.start_time),
                end: formatTime(appointment.end_time),
              })}
            </p>
            <p dir="ltr" className="mt-1 text-start text-xs text-muted-foreground">
              {appointment.customer_email}
              {appointment.customer_phone ? ` · ${appointment.customer_phone}` : ""}
            </p>
          </div>
          {isActive ? <AppointmentActions appointmentId={appointment.id} /> : null}
        </div>
      </LiquidCard>
    );
  }

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader title={t("title")} description={t("description")} />

      <LiquidCard className="p-5">
        <form method="get" action="/dashboard/bookings" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor="status">{t("filter.status")}</Label>
            <NativeSelect id="status" name="status" defaultValue={status ?? ""} className="w-full">
              <option value="">{t("filter.allStatuses")}</option>
              {APPOINTMENT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {tStatus(value)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor="date">{t("filter.date")}</Label>
            <Input id="date" name="date" type="date" defaultValue={date ?? ""} />
          </div>
          <Button type="submit">{t("filter.apply")}</Button>
          {isFiltered ? (
            <Button asChild variant="ghost">
              <Link href="/dashboard/bookings">{t("filter.reset")}</Link>
            </Button>
          ) : null}
        </form>
      </LiquidCard>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-tight text-foreground">
          {t("upcoming", { count: upcoming.length })}
        </h2>
        {upcoming.length === 0 ? (
          <LiquidCard>
            <EmptyState
              icon={CalendarX2}
              title={isFiltered ? t("emptyFilteredTitle") : t("emptyUpcomingTitle")}
              description={
                isFiltered
                  ? t("emptyFilteredDescription")
                  : hasServices
                    ? t("emptyUpcomingWithServices")
                    : t("emptyUpcomingNoServices")
              }
              action={
                isFiltered ? (
                  <Link href="/dashboard/bookings" className="mt-2 text-sm font-medium text-primary hover:text-primary">
                    {t("filter.resetFilter")}
                  </Link>
                ) : undefined
              }
            />
          </LiquidCard>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appointment) => (
              <AppointmentRow key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-tight text-foreground">
          {t("past", { count: past.length })}
        </h2>
        {past.length === 0 ? (
          <LiquidCard>
            <EmptyState icon={CalendarX2} title={t("emptyPastTitle")} description={t("emptyPastDescription")} />
          </LiquidCard>
        ) : (
          <div className="space-y-3">
            {past.map((appointment) => (
              <AppointmentRow key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
