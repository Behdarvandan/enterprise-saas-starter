"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import LegacyButton from "@/components/ui/LegacyButton";
import { formatAppointmentTime } from "@/lib/utils";

export interface BookableService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
}

interface BookingSlot {
  startTime: string;
  endTime: string;
}

interface BookingFormProps {
  organizationId: string;
  services: BookableService[];
}

function todayLocalDate(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatPrice(cents: number): string {
  if (cents <= 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function BookingForm({
  organizationId,
  services,
}: BookingFormProps) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState(todayLocalDate());
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deviceInfo, setDeviceInfo] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedService =
    services.find((service) => service.id === serviceId) ?? services[0] ?? null;

  useEffect(() => {
    if (!serviceId || !date) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    setSlotsError(null);

    const params = new URLSearchParams({
      organizationId,
      serviceId,
      date,
    });

    fetch(`/api/booking/slots?${params.toString()}`)
      .then((response) => response.json())
      .then((data: { slots?: BookingSlot[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setSlotsError(data.error);
          setSlots([]);
        } else {
          setSlots(data.slots ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSlotsError("Could not load available times.");
          setSlots([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId, serviceId, date]);

  function handleServiceChange(nextId: string) {
    setServiceId(nextId);
    setSelectedStartTime("");
  }

  function handleDateChange(value: string) {
    setDate(value);
    setSelectedStartTime("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedService || !selectedStartTime) {
      setError("Please select an available time slot.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          serviceId: selectedService.id,
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          deviceInfo: deviceInfo || null,
          issueDescription: issueDescription || null,
          startTime: selectedStartTime,
        }),
      });

      const data = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || data.error) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      if (!data.url) {
        setError("Could not start the booking.");
        return;
      }

      window.location.assign(data.url);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          1. Choose a service
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {services.map((service) => {
            const active = service.id === selectedService?.id;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => handleServiceChange(service.id)}
                className={`rounded-lg border p-4 text-left transition ${
                  active
                    ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {service.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-brand-600">
                    {formatPrice(service.price)}
                  </span>
                </div>
                {service.description && (
                  <p className="mt-1 text-xs text-slate-500">
                    {service.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  {service.duration_minutes} minutes
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          2. Pick a date and time
        </h2>
        <div className="mt-4">
          <label htmlFor="date" className="text-xs font-medium text-slate-500">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            min={todayLocalDate()}
            onChange={(event) => handleDateChange(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:w-56"
          />
        </div>

        <div className="mt-4">
          {loadingSlots ? (
            <p className="text-sm text-slate-500">Loading available times…</p>
          ) : slotsError ? (
            <p className="text-sm font-medium text-red-600">{slotsError}</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-500">
              No available times for this date.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {slots.map((slot) => {
                const active = slot.startTime === selectedStartTime;
                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    onClick={() => setSelectedStartTime(slot.startTime)}
                    className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                      active
                        ? "border-brand-500 bg-brand-600 text-white"
                        : "border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50"
                    }`}
                  >
                    {formatAppointmentTime(slot.startTime)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          3. Your details
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="text"
            name="name"
            required
            placeholder="Full name"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <input
            type="email"
            name="email"
            required
            placeholder="Email address"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone (optional)"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <input
            type="text"
            name="device"
            placeholder="Device (e.g. iPhone 13, Dell XPS 15)"
            value={deviceInfo}
            onChange={(event) => setDeviceInfo(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="mt-3">
          <textarea
            name="issue"
            placeholder="Describe the issue (optional)"
            rows={3}
            value={issueDescription}
            onChange={(event) => setIssueDescription(event.target.value)}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}

        <LegacyButton type="submit" disabled={submitting} className="mt-6 w-full">
          {submitting
            ? "Redirecting..."
            : selectedService && selectedService.price > 0
              ? "Continue to payment"
              : "Confirm booking"}
        </LegacyButton>
      </div>
    </form>
  );
}
