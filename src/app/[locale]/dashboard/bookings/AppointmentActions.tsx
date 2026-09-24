"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/core/ui/primitives/button";
import { Input } from "@/core/ui/primitives/input";
import { useRouter } from "@/i18n/navigation";
import { cancelAppointment, rescheduleAppointment } from "./actions";

export default function AppointmentActions({ appointmentId }: { appointmentId: string }) {
  const t = useTranslations("dashboard.bookings.actions");
  const router = useRouter();
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDateTime, setNewDateTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    const result = await cancelAppointment(appointmentId);
    if (result.error) setError(result.error);
    setLoading(false);
    router.refresh();
  }

  async function handleReschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await rescheduleAppointment(appointmentId, newDateTime);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setShowReschedule(false);
    setNewDateTime("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-expanded={showReschedule}
          onClick={() => setShowReschedule((value) => !value)}
          disabled={loading}
        >
          {t("reschedule")}
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={handleCancel} loading={loading}>
          {loading ? t("working") : t("cancel")}
        </Button>
      </div>

      {showReschedule ? (
        <form onSubmit={handleReschedule} className="flex w-full flex-col gap-2 sm:flex-row">
          <Input
            type="datetime-local"
            required
            dir="ltr"
            aria-label={t("newTime")}
            value={newDateTime}
            onChange={(event) => setNewDateTime(event.target.value)}
            className="h-8 text-xs"
          />
          <Button type="submit" size="sm" disabled={loading}>
            {t("save")}
          </Button>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs font-medium text-status-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
