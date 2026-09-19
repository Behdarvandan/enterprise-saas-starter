import { NextResponse } from "next/server";
import { withApiErrorHandling } from "@/lib/api-error";
import { requireMembershipOrResponse } from "@/lib/auth";
import { chunksQuerySchema } from "@/lib/rag/schemas";
import type { IngestChunk } from "@/types";

/**
 * GET /api/rag/ingest/chunks?documentId=&cursor=&limit=
 * Pages through a document's stored chunks (embeddings excluded) for the
 * knowledge-base preview. Runs under the caller's RLS; the explicit
 * organization filter is defence in depth.
 */
export const GET = withApiErrorHandling(
  "RAG chunk list error",
  "Failed to load chunks.",
  async (request: Request) => {
    const auth = await requireMembershipOrResponse();
    if ("response" in auth) return auth.response;
    const { supabase, membership } = auth;

    const parsed = chunksQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query.", code: "invalid_body" }, { status: 400 });
    }
    const { documentId, cursor, limit } = parsed.data;

    // One extra row tells us whether another page exists.
    const { data, error } = await supabase
      .from("document_chunks")
      .select("id, chunk_index, content, token_count")
      .eq("organization_id", membership.organizationId)
      .eq("document_id", documentId)
      .gt("chunk_index", cursor)
      .order("chunk_index", { ascending: true })
      .limit(limit + 1);

    if (error) throw error;

    const rows = data ?? [];
    const page = rows.slice(0, limit);
    const chunks: IngestChunk[] = page.map((row) => ({
      id: row.id,
      chunkIndex: row.chunk_index,
      content: row.content,
      tokenCount: row.token_count,
    }));

    return NextResponse.json({
      chunks,
      nextCursor: rows.length > limit ? page[page.length - 1].chunk_index : null,
    });
  },
);
