export { cn } from "cn";
import type { AppointmentStatus } from "@/types";

/**
 * Shared Badge tone mapping for appointment status, used by every screen
 * that lists appointments (dashboard bookings, dashboard overview) so the
 * mapping stays in one place instead of being redeclared per page.
 */
export const appointmentStatusTone: Record<
  AppointmentStatus,
  "warn" | "success" | "error" | "neutral"
> = {
  pending: "warn",
  confirmed: "success",
  cancelled: "error",
  completed: "neutral",
};

const APPOINTMENT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
};

const APPOINTMENT_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
};

/**
 * Formats an ISO timestamp as a human-readable date. Times are rendered in UTC
 * to match the booking engine, which anchors availability windows to UTC.
 */
export function formatAppointmentDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", APPOINTMENT_DATE_FORMAT);
}

/**
 * Formats an ISO timestamp as a human-readable time (e.g. "9:00 AM").
 */
export function formatAppointmentTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString("en-US", APPOINTMENT_TIME_FORMAT);
}

/**
 * Formats a short calendar date (e.g. "1/1/2026") for list/table display.
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US");
}

/**
 * Formats a USD amount stored in cents (e.g. 1500 -> "$15.00"), rendering
 * non-positive amounts as "Free".
 */
export function formatPrice(cents: number): string {
  if (cents <= 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

const PLAN_CURRENCY_LOCALE: Record<"TRY" | "EUR" | "USD", string> = {
  TRY: "tr-TR",
  EUR: "de-DE",
  USD: "en-US",
};

/**
 * Formats a geo-pricing plan amount stored in minor units (kuruş/cents) for
 * display, e.g. `formatPlanPrice(149900, "TRY")` -> "1.499 ₺". Whole-number
 * plan prices only (no decimals), matching the brief's locked figures.
 */
export function formatPlanPrice(amount: number, currency: "TRY" | "EUR" | "USD"): string {
  return new Intl.NumberFormat(PLAN_CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}
