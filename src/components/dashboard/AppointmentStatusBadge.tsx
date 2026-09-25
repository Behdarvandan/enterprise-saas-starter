import { getTranslations } from "next-intl/server";
import { Badge } from "@/core/ui/primitives/badge";
import { asAppointmentStatus } from "@/lib/status";
import { appointmentStatusTone } from "@/lib/utils";
import type { AppointmentStatus } from "@/types";

const toneClassName: Record<"warn" | "success" | "error" | "neutral", string> = {
  warn: "border-status-warn/30 bg-status-warn/10 text-status-warn",
  success: "border-status-success/30 bg-status-success/10 text-status-success",
  error: "border-status-error/30 bg-status-error/10 text-status-error",
  neutral: "border-border bg-muted text-muted-foreground",
};

/** Localized, tone-coded appointment status. Unknown values render verbatim. */
export default async function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const t = await getTranslations("status.appointment");
  const known = asAppointmentStatus(status);

  return (
    <Badge variant="outline" className={toneClassName[appointmentStatusTone[status]]}>
      {known ? t(known) : status}
    </Badge>
  );
}
