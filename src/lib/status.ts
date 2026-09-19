/** Narrowing guards for status strings the database stores as plain `text`. */

export const APPOINTMENT_STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;
export type KnownAppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export function asAppointmentStatus(value: string): KnownAppointmentStatus | null {
  return (APPOINTMENT_STATUSES as readonly string[]).includes(value)
    ? (value as KnownAppointmentStatus)
    : null;
}

export const SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due", "canceled", "inactive"] as const;
export type KnownSubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export function asSubscriptionStatus(value: string): KnownSubscriptionStatus | null {
  return (SUBSCRIPTION_STATUSES as readonly string[]).includes(value)
    ? (value as KnownSubscriptionStatus)
    : null;
}

export const MEMBERSHIP_ROLES = ["owner", "admin", "member"] as const;
export type KnownMembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export function asMembershipRole(value: string): KnownMembershipRole | null {
  return (MEMBERSHIP_ROLES as readonly string[]).includes(value) ? (value as KnownMembershipRole) : null;
}
