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
export type PortalKind = Database["public"]["Enums"]["portal_kind"];

// Freelance operations & enterprise starter-kit entities.
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadStatus = Lead["status"];
export type ClientProject = Database["public"]["Tables"]["client_projects"]["Row"];
export type ProjectStage = ClientProject["stage"];
export type ClientInvoice = Database["public"]["Tables"]["client_invoices"]["Row"];
export type InvoiceStatus = ClientInvoice["status"];
export type SaasSubscription = Database["public"]["Tables"]["saas_subscriptions"]["Row"];
export type InternalTask = Database["public"]["Tables"]["internal_tasks"]["Row"];
export type TaskColumnStatus = InternalTask["column_status"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type PlatformSettings = Database["public"]["Tables"]["platform_settings"]["Row"];
export type Agency = Database["public"]["Tables"]["agencies"]["Row"];
export type AgencyCnameStatus = Agency["cname_status"];
// Named to match src/lib/sso/adapter.ts's SsoConnectionProvider, avoiding a
// clash with that module's own (interface) SsoProvider export.
export type SsoConnectionProviderKind = Database["public"]["Enums"]["sso_provider"];
export type SsoConnection = Database["public"]["Tables"]["sso_connections"]["Row"];
export type UsageQuota = Database["public"]["Tables"]["usage_quotas"]["Row"];

// AI Chatbot & RAG Knowledge Assistant entities.
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentChunk = Database["public"]["Tables"]["document_chunks"]["Row"];
export type ChatSession = Database["public"]["Tables"]["chat_sessions"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

// Appointment & Reservation System entities.
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type AvailabilitySlot = Database["public"]["Tables"]["availability_slots"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type AppointmentStatus = Appointment["status"];

/** Backwards-compatible alias for the user profile row. */
export type UserProfile = Profile;

export interface NavItem {
  label: string;
  href: string;
}

// RAG chat wire contract, shared between `POST/GET /api/chat/rag` and the
// `ChatWidget` client component so the two ends of the SSE protocol cannot
// silently drift apart.
export interface ChatRequestBody {
  organizationId: string;
  sessionId?: string | null;
  message: string;
}

export interface ChatMatchSource {
  documentId: string;
  chunkIndex: number;
  content: string;
  similarity: number;
}

export type ChatStreamEvent =
  | { type: "session"; sessionId: string }
  | { type: "sources"; sources: ChatMatchSource[] }
  | { type: "delta"; content: string }
  | { type: "done" }
  | { type: "error"; message: string };
