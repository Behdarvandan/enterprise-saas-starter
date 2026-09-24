import type { Session, User } from "@supabase/supabase-js";

/** Minimal user projection core needs — id/email only (the only fields the app dereferences today). */
export type CoreUser = Pick<User, "id" | "email">;

/** Minimal session projection, derived from Supabase's own Session shape. */
export interface CoreSession extends Pick<Session, "access_token" | "expires_at" | "refresh_token"> {
  user: CoreUser;
}

export type TenantRole = "owner" | "admin" | "member";
