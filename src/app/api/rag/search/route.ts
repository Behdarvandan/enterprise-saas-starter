import { NextResponse } from "next/server";
import { withApiErrorHandling } from "@/lib/api-error";
import { requireMembershipOrResponse } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getEmbedding } from "@/lib/rag/embeddings";
import { searchBodySchema } from "@/lib/rag/schemas";
import { getActiveTenantConfig } from "@/lib/skills/queries";
import { readRagSearchValues } from "@/lib/skills/tenant-config";
import type { RagSearchHit } from "@/types";

/**
 * POST /api/rag/search  { query }
 * Retrieval simulator: runs the same `match_document_chunks` lookup the agent
 * uses, with the tenant's own `top_k` / `similarity_threshold`, and returns
 * the ranked chunks with their similarity so users can see what the agent
 * would read for a given question.
 */
export const POST = withApiErrorHandling(
  "RAG search error",
  "Failed to search the knowledge base.",
  async (request: Request) => {
    const auth = await requireMembershipOrResponse();
    if ("response" in auth) return auth.response;
    const { supabase, user, membership } = auth;

    // Each search is a paid embedding call.
    if (!(await checkRateLimit(`rag-search:${user.id}`))) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly.", code: "rate_limited" },
        { status: 429 },
      );
    }

    const parsed = searchBodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "A query is required.", code: "invalid_body" }, { status: 400 });
    }

    const params = readRagSearchValues(await getActiveTenantConfig(membership.organizationId));
    const embedding = await getEmbedding(parsed.data.query);

    const { data: matches, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: embedding,
      match_organization_id: membership.organizationId,
      match_count: params.top_k,
      match_threshold: params.similarity_threshold,
    });
    if (error) throw error;

    const documentIds = [...new Set((matches ?? []).map((match) => match.document_id))];
    const { data: documents, error: documentError } = documentIds.length
      ? await supabase.from("documents").select("id, title").in("id", documentIds)
      : { data: [], error: null };
    if (documentError) throw documentError;

    const titleById = new Map((documents ?? []).map((doc) => [doc.id, doc.title]));
    const hits: RagSearchHit[] = (matches ?? []).map((match) => ({
      chunkId: match.id,
      documentId: match.document_id,
      documentTitle: titleById.get(match.document_id) ?? "",
      chunkIndex: match.chunk_index,
      content: match.content,
      similarity: match.similarity,
    }));

    return NextResponse.json({
      hits,
      params: { topK: params.top_k, threshold: params.similarity_threshold },
    });
  },
);
