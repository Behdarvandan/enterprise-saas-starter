export { cn } from "cn";

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
