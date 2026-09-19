import { z } from "zod";
import { postgresUuid } from "@/lib/validation";
import { MAX_CONTENT_LENGTH } from "@/lib/rag/file-types";

/**
 * Wire contracts for `/api/rag/*`, shared by the route handlers and the
 * knowledge-base client so the two ends cannot drift apart.
 */

// Mirrors the `documents.source_type` CHECK constraint
// (`supabase/migrations/20261109000000_ai_rag_chatbot.sql`).
export const sourceTypeSchema = z.enum(["text", "file", "url"]);

export const ingestJsonSchema = z.object({
  title: z.string().trim().max(200).optional(),
  content: z
    .string()
    .refine((value) => value.trim().length > 0, { message: "content_required" })
    .refine((value) => value.length <= MAX_CONTENT_LENGTH, { message: "too_large" }),
  sourceType: sourceTypeSchema.default("text"),
});

export const MAX_BULK_DELETE = 100;

export const bulkDeleteSchema = z.object({
  documentIds: z.array(postgresUuid()).min(1).max(MAX_BULK_DELETE),
});

export const CHUNK_PAGE_SIZE = 20;

export const chunksQuerySchema = z.object({
  documentId: postgresUuid(),
  /** Exclusive `chunk_index` cursor; -1 starts from the first chunk. */
  cursor: z.coerce.number().int().min(-1).default(-1),
  limit: z.coerce.number().int().min(1).max(50).default(CHUNK_PAGE_SIZE),
});

export const searchBodySchema = z.object({
  query: z.string().trim().min(1).max(500),
});

/** Stable machine codes; the UI maps them to localized copy. */
export type RagErrorCode =
  | "invalid_body"
  | "content_required"
  | "too_large"
  | "unsupported_type"
  | "extract_failed"
  | "empty_document"
  | "not_found"
  | "rate_limited"
  | "ingest_failed"
  | "server_error"
  | "unauthorized"
  | "noMembership";
