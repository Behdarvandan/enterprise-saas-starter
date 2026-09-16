"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cancelAppointment, rescheduleAppointment } from "./actions";

export default function AppointmentActions({
  appointmentId,
}: {
  appointmentId: string;
}) {
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
          onClick={() => setShowReschedule((value) => !value)}
          disabled={loading}
          className="px-3 py-1.5 text-xs"
        >
          Reschedule
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleCancel}
          disabled={loading}
          className="px-3 py-1.5 text-xs"
        >
          {loading ? "Working..." : "Cancel"}
        </Button>
      </div>

      {showReschedule && (
        <form
          onSubmit={handleReschedule}
          className="flex w-full flex-col gap-2 sm:flex-row"
        >
          <input
            type="datetime-local"
            required
            value={newDateTime}
            onChange={(event) => setNewDateTime(event.target.value)}
            className="rounded-control border border-subtle bg-surface-raised px-3 py-2 text-xs text-ink-primary outline-none transition-colors focus:border-violet-dim"
          />
          <Button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 text-xs"
          >
            Save
          </Button>
        </form>
      )}

      {error && <p className="text-xs font-medium text-status-error">{error}</p>}
    </div>
  );
}
