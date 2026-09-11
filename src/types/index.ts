/**
 * Application-level shared TypeScript contracts.
 */

import type { Database } from "./database";

export type { Database, Json } from "./database";

// Convenience entity types derived from the generated database schema.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Membership = Database["public"]["Tables"]["memberships"]["Row"];
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
export type MembershipRole = Database["public"]["Enums"]["membership_role"];

// AI Chatbot & RAG Knowledge Assistant entities.
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentChunk = Database["public"]["Tables"]["document_chunks"]["Row"];
export type ChatSession = Database["public"]["Tables"]["chat_sessions"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

/** Backwards-compatible alias for the user profile row. */
export type UserProfile = Profile;

export interface NavItem {
  label: string;
  href: string;
}
