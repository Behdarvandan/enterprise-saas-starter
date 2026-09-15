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
