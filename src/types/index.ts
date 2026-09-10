/**
 * Application-level shared TypeScript contracts.
 */

import type { Database } from "./database";

export type { Database, Json } from "./database";

// Convenience entity types derived from the generated database schema.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Membership = Database["public"]["Tables"]["memberships"]["Row"];
export type MembershipRole = Database["public"]["Enums"]["membership_role"];

/** Backwards-compatible alias for the user profile row. */
export type UserProfile = Profile;

export interface NavItem {
  label: string;
  href: string;
}
