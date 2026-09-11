import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserMembership } from "@/lib/team";
import {
  chunkText,
  getEmbedding,
  mapWithConcurrency,
} from "@/lib/rag/embeddings";

const MAX_CONTENT_LENGTH = 500_000;
const EMBEDDING_CONCURRENCY = 5;
const INSERT_BATCH_SIZE = 50;

/**
 * GET /api/rag/ingest
 * Lists the authenticated user's organization documents (and chunk counts)
 * so the dashboard knowledge-base panel can render the current state.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const membership = await getUserMembership(user.id);
    if (!membership) {
      return NextResponse.json(
        { error: "You do not belong to an organization." },
        { status: 403 },
      );
    }

    const { data: documents, error } = await supabase
      .from("documents")
      .select("id, title, source_type, status, created_at")
      .eq("organization_id", membership.organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Lightweight per-document chunk counts for display purposes.
    const { data: chunks } = await supabase
      .from("document_chunks")
      .select("document_id")
      .eq("organization_id", membership.organizationId);

    const counts = new Map<string, number>();
    for (const chunk of chunks ?? []) {
      counts.set(chunk.document_id, (counts.get(chunk.document_id) ?? 0) + 1);
    }

    const result = (documents ?? []).map((doc) => ({
      ...doc,
      chunk_count: counts.get(doc.id) ?? 0,
    }));

    return NextResponse.json({ documents: result });
  } catch (error) {
    console.error("RAG ingestion list error:", error);
    return NextResponse.json(
      { error: "Failed to load documents." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/rag/ingest
 * Authenticated ingestion: chunks the provided text, generates embeddings,
 * and bulk-inserts them into `document_chunks` for the caller's organization.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const membership = await getUserMembership(user.id);
    if (!membership) {
      return NextResponse.json(
        { error: "You do not belong to an organization." },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      title?: string;
      content?: string;
      sourceType?: string;
    } | null;

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const sourceType = typeof body?.sourceType === "string" ? body.sourceType : "text";
    const content = typeof body?.content === "string" ? body.content : "";

    if (!content.trim()) {
      return NextResponse.json({ error: "Content is required." }, { status: 400 });
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: "Content exceeds the maximum allowed size." },
        { status: 413 },
      );
    }

    const organizationId = membership.organizationId;
    const byteSize = new TextEncoder().encode(content).length;

    const { data: document, error: documentError } = await supabase
      .from("documents")
      .insert({
        organization_id: organizationId,
        title: title || "Untitled document",
        source_type: sourceType,
        content,
        status: "processing",
        created_by: user.id,
        byte_size: byteSize,
      })
      .select("id")
      .single();

    if (documentError || !document) {
      throw documentError ?? new Error("Failed to create the document record.");
    }

    const chunks = chunkText(content);

    const rows = await mapWithConcurrency(chunks, EMBEDDING_CONCURRENCY, async (chunk) => {
      const embedding = await getEmbedding(chunk.content);
      return {
        organization_id: organizationId,
        document_id: document.id,
        chunk_index: chunk.index,
        content: chunk.content,
        token_count: chunk.tokenCount,
        embedding,
      };
    });

    // Insert in batches to stay within PostgREST request-size limits.
    for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
      const batch = rows.slice(i, i + INSERT_BATCH_SIZE);
      const { error: chunkError } = await supabase
        .from("document_chunks")
        .insert(batch);
      if (chunkError) throw chunkError;
    }

    await supabase
      .from("documents")
      .update({ status: "ready" })
      .eq("id", document.id);

    return NextResponse.json(
      { documentId: document.id, chunkCount: rows.length },
      { status: 201 },
    );
  } catch (error) {
    console.error("RAG ingestion error:", error);
    return NextResponse.json(
      { error: "Failed to ingest the document." },
      { status: 500 },
    );
  }
}
