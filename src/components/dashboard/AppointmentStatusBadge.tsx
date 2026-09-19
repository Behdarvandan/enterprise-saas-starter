import { getTranslations } from "next-intl/server";
import Badge from "@/components/ui/Badge";
import { asAppointmentStatus } from "@/lib/status";
import { appointmentStatusTone } from "@/lib/utils";
import type { AppointmentStatus } from "@/types";

/** Localized, tone-coded appointment status. Unknown values render verbatim. */
export default async function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const t = await getTranslations("status.appointment");
  const known = asAppointmentStatus(status);

  return <Badge tone={appointmentStatusTone[status]}>{known ? t(known) : status}</Badge>;
}
