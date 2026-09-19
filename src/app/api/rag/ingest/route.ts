import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { withApiErrorHandling } from "@/lib/api-error";
import { requireMembershipOrResponse } from "@/lib/auth";
import { chunkText, getEmbedding, mapWithConcurrency } from "@/lib/rag/embeddings";
import { ExtractionError, extractText, UnsupportedFileError } from "@/lib/rag/extract-text";
import {
  classifyFile,
  MAX_CONTENT_LENGTH,
  MAX_FILE_BYTES,
  titleFromFileName,
} from "@/lib/rag/file-types";
import {
  bulkDeleteSchema,
  ingestJsonSchema,
  type RagErrorCode,
} from "@/lib/rag/schemas";
import { postgresUuid } from "@/lib/validation";
import type { DocumentListItem, DocumentSourceType, DocumentStatus } from "@/types";
import type { Database } from "@/types/database";

// Embedding a long document is one Gemini call per chunk; give it room.
export const maxDuration = 60;

const EMBEDDING_CONCURRENCY = 5;
const INSERT_BATCH_SIZE = 50;

function fail(code: RagErrorCode, status: number, error: string): NextResponse {
  return NextResponse.json({ error, code }, { status });
}

function toStatus(value: string): DocumentStatus {
  return value === "processing" || value === "ready" ? value : "failed";
}

function toSourceType(value: string): DocumentSourceType {
  return value === "file" || value === "url" ? value : "text";
}

function readFailureMessage(metadata: unknown): string | null {
  if (metadata && typeof metadata === "object" && "error" in metadata) {
    const message = (metadata as { error: unknown }).error;
    return typeof message === "string" ? message : null;
  }
  return null;
}

/**
 * GET /api/rag/ingest
 * Lists the caller's organization documents with status and chunk counts. The
 * dashboard polls this while any document is still `processing`.
 */
export const GET = withApiErrorHandling(
  "RAG ingestion list error",
  "Failed to load documents.",
  async () => {
    const auth = await requireMembershipOrResponse();
    if ("response" in auth) return auth.response;
    const { supabase, membership } = auth;

    const { data, error } = await supabase
      .from("documents")
      .select(
        "id, title, source_type, status, created_at, byte_size, mime_type, metadata, document_chunks(count)",
      )
      .eq("organization_id", membership.organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const documents: DocumentListItem[] = (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      sourceType: toSourceType(row.source_type),
      status: toStatus(row.status),
      createdAt: row.created_at,
      byteSize: row.byte_size,
      mimeType: row.mime_type,
      chunkCount: row.document_chunks[0]?.count ?? 0,
      error: readFailureMessage(row.metadata),
    }));

    return NextResponse.json({ documents });
  },
);

interface IngestInput {
  title: string;
  content: string;
  sourceType: DocumentSourceType;
  mimeType: string | null;
}

/** Reads either a multipart file upload or the JSON `{title, content}` body. */
async function readIngestInput(request: Request): Promise<IngestInput | NextResponse> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!form || !(file instanceof File)) {
      return fail("invalid_body", 400, "A file is required.");
    }
    if (file.size > MAX_FILE_BYTES) return fail("too_large", 413, "The file is too large.");
    if (!classifyFile(file.name)) return fail("unsupported_type", 415, "Unsupported file type.");

    let text: string;
    try {
      ({ text } = await extractText(file));
    } catch (error) {
      if (error instanceof UnsupportedFileError) {
        return fail("unsupported_type", 415, "Unsupported file type.");
      }
      if (error instanceof ExtractionError) {
        return fail("extract_failed", 422, "The file could not be read.");
      }
      throw error;
    }

    if (text.trim().length === 0) {
      return fail("empty_document", 422, "The file contains no readable text.");
    }
    if (text.length > MAX_CONTENT_LENGTH) return fail("too_large", 413, "The document is too long.");

    const providedTitle = form.get("title");
    return {
      title:
        (typeof providedTitle === "string" ? providedTitle.trim() : "") ||
        titleFromFileName(file.name),
      content: text,
      sourceType: "file",
      mimeType: file.type || null,
    };
  }

  const parsed = ingestJsonSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message;
    if (message === "content_required") return fail(message, 400, "Content is required.");
    if (message === "too_large") return fail(message, 413, "The document is too long.");
    return fail("invalid_body", 400, "Invalid request body.");
  }

  return {
    title: parsed.data.title ?? "",
    content: parsed.data.content,
    sourceType: parsed.data.sourceType,
    mimeType: null,
  };
}

/**
 * Records a failed ingest: the document row is kept (so the user sees what
 * went wrong and can retry) but flagged `failed`, and any partial chunks are
 * removed so retrieval never serves half a document.
 */
async function markIngestFailed(
  supabase: SupabaseClient<Database>,
  documentId: string,
  reason: string,
): Promise<void> {
  const { error: chunkError } = await supabase
    .from("document_chunks")
    .delete()
    .eq("document_id", documentId);
  if (chunkError) console.error("[rag] failed to clean partial chunks:", chunkError);

  const { error: statusError } = await supabase
    .from("documents")
    .update({ status: "failed", metadata: { error: reason.slice(0, 300) } })
    .eq("id", documentId);
  if (statusError) console.error("[rag] failed to mark document failed:", statusError);
}

/**
 * POST /api/rag/ingest
 * Authenticated ingestion of a file (multipart `file`, optional `title`) or
 * pasted text (JSON `{title, content}`): chunks the text, embeds each chunk
 * and stores them for the caller's organization.
 */
export const POST = withApiErrorHandling(
  "RAG ingestion error",
  "Failed to ingest the document.",
  async (request: Request) => {
    const auth = await requireMembershipOrResponse();
    if ("response" in auth) return auth.response;
    const { supabase, user, membership } = auth;

    const input = await readIngestInput(request);
    if (input instanceof NextResponse) return input;

    const organizationId = membership.organizationId;

    const { data: document, error: documentError } = await supabase
      .from("documents")
      .insert({
        organization_id: organizationId,
        title: input.title || "Untitled document",
        source_type: input.sourceType,
        mime_type: input.mimeType,
        content: input.content,
        status: "processing",
        created_by: user.id,
        byte_size: new TextEncoder().encode(input.content).length,
      })
      .select("id")
      .single();

    if (documentError || !document) {
      throw documentError ?? new Error("Failed to create the document record.");
    }

    try {
      const chunks = chunkText(input.content);
      const rows = await mapWithConcurrency(chunks, EMBEDDING_CONCURRENCY, async (chunk) => ({
        organization_id: organizationId,
        document_id: document.id,
        chunk_index: chunk.index,
        content: chunk.content,
        token_count: chunk.tokenCount,
        embedding: await getEmbedding(chunk.content),
      }));

      // Insert in batches to stay within PostgREST request-size limits.
      for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
        const { error: chunkError } = await supabase
          .from("document_chunks")
          .insert(rows.slice(i, i + INSERT_BATCH_SIZE));
        if (chunkError) throw chunkError;
      }

      const { error: readyError } = await supabase
        .from("documents")
        .update({ status: "ready" })
        .eq("id", document.id);
      if (readyError) throw readyError;

      return NextResponse.json(
        { documentId: document.id, chunkCount: rows.length },
        { status: 201 },
      );
    } catch (error) {
      await markIngestFailed(
        supabase,
        document.id,
        error instanceof Error ? error.message : "Ingestion failed.",
      );
      Sentry.captureException(error, { tags: { route: "RAG ingestion error" } });
      return NextResponse.json(
        {
          error: "Failed to ingest the document.",
          code: "ingest_failed" satisfies RagErrorCode,
          documentId: document.id,
        },
        { status: 500 },
      );
    }
  },
);

/**
 * DELETE /api/rag/ingest
 * Removes knowledge-base documents (their chunks go with them via
 * `on delete cascade`), scoped to the caller's organization. Accepts a JSON
 * body `{ documentIds: string[] }` (bulk, max 100) or, for a single document,
 * `?documentId=`. Responds `{ deleted, notFound }`.
 */
export const DELETE = withApiErrorHandling(
  "RAG document delete error",
  "Failed to delete the document.",
  async (request: Request) => {
    const auth = await requireMembershipOrResponse();
    if ("response" in auth) return auth.response;
    const { supabase, membership } = auth;

    const singleId = new URL(request.url).searchParams.get("documentId");
    let ids: string[];

    if (singleId !== null) {
      const parsedId = postgresUuid().safeParse(singleId);
      if (!parsedId.success) return fail("invalid_body", 400, "A valid documentId is required.");
      ids = [parsedId.data];
    } else {
      const parsed = bulkDeleteSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return fail("invalid_body", 400, "documentIds must be 1–100 valid ids.");
      ids = [...new Set(parsed.data.documentIds)];
    }

    const { data: deleted, error } = await supabase
      .from("documents")
      .delete()
      .in("id", ids)
      .eq("organization_id", membership.organizationId)
      .select("id");

    if (error) throw error;

    const deletedIds = new Set((deleted ?? []).map((row) => row.id));
    if (deletedIds.size === 0) return fail("not_found", 404, "Document not found.");

    return NextResponse.json({
      deleted: deletedIds.size,
      notFound: ids.filter((id) => !deletedIds.has(id)),
    });
  },
);
