import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmbedding } from "@/lib/rag/embeddings";
import { streamChatCompletion, type LLMMessage } from "@/lib/rag/llm";
import type { Json } from "@/types";

const MATCH_COUNT = 5;
const MATCH_THRESHOLD = 0.5;
const HISTORY_LIMIT = 12;
const MAX_MESSAGE_LENGTH = 4000;

interface ChatRequestBody {
  organizationId?: string;
  sessionId?: string | null;
  message?: string;
}

interface MatchSource {
  documentId: string;
  chunkIndex: number;
  content: string;
  similarity: number;
}

/** Serializes a JSON payload as a Server-Sent Events `data:` frame. */
function toSSE(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/rag?organizationId=...&sessionId=...
 * Returns the conversation history for a visitor's session. Used by the
 * widget to restore context after a page reload.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const sessionId = searchParams.get("sessionId");

    if (!organizationId || !sessionId) {
      return NextResponse.json(
        { error: "organizationId and sessionId are required." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Confirm the session belongs to the requested tenant before returning data.
    const { data: session } = await admin
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const { data: messages, error } = await admin
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", sessionId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages: messages ?? [] });
  } catch (error) {
    console.error("RAG chat history error:", error);
    return NextResponse.json(
      { error: "Failed to load the conversation." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/chat/rag
 * Receives a visitor prompt, retrieves the tenant's most relevant knowledge
 * chunks via the `match_document_chunks` RPC, and streams an LLM answer back
 * as Server-Sent Events. Runs with the service-role client because visitors
 * are anonymous; tenant isolation is enforced by the explicit
 * `organization_id` filter on every query and RPC call.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ChatRequestBody;

  const organizationId = body.organizationId;
  const message = body.message?.trim();

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId is required." },
      { status: 400 },
    );
  }

  if (!message) {
    return NextResponse.json({ error: "A message is required." }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: "Message exceeds the maximum allowed length." },
      { status: 413 },
    );
  }

  const admin = createAdminClient();

  try {
    // Resolve or create a session scoped strictly to the tenant.
    let sessionId = body.sessionId ?? null;

    if (sessionId) {
      const { data: existing } = await admin
        .from("chat_sessions")
        .select("id")
        .eq("id", sessionId)
        .eq("organization_id", organizationId)
        .maybeSingle();

      // A missing or cross-tenant session id is discarded.
      if (!existing) sessionId = null;
    }

    if (!sessionId) {
      const { data: created, error } = await admin
        .from("chat_sessions")
        .insert({ organization_id: organizationId })
        .select("id")
        .single();

      if (error || !created) {
        throw error ?? new Error("Failed to create the chat session.");
      }

      sessionId = created.id;
    }

    // Persist the visitor's message.
    const { error: userMessageError } = await admin.from("chat_messages").insert({
      organization_id: organizationId,
      session_id: sessionId,
      role: "user",
      content: message,
    });

    if (userMessageError) throw userMessageError;

    // Recent conversation history (newest first) for context.
    const { data: history } = await admin
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);

    // Retrieve the most relevant knowledge chunks for the tenant.
    const queryEmbedding = await getEmbedding(message);
    const { data: matches, error: matchError } = await admin.rpc(
      "match_document_chunks",
      {
        query_embedding: queryEmbedding,
        match_organization_id: organizationId,
        match_count: MATCH_COUNT,
        match_threshold: MATCH_THRESHOLD,
      },
    );

    if (matchError) throw matchError;

    const sources: MatchSource[] = (matches ?? []).map((match) => ({
      documentId: match.document_id,
      chunkIndex: match.chunk_index,
      content: match.content,
      similarity: match.similarity,
    }));

    // Build the prompt: system instructions + knowledge context + history.
    const context = sources.map((source) => source.content).join("\n\n---\n\n");

    const messages: LLMMessage[] = [
      {
        role: "system",
        content: [
          "You are a helpful knowledge-base assistant.",
          "Answer the visitor's question using only the provided context.",
          "If the context does not contain the answer, say you do not know and",
          "suggest that the visitor contact support. Never invent information.",
          "Keep responses concise and professional.",
          "",
          "CONTEXT:",
          context || "(no relevant context found)",
        ].join("\n"),
      },
    ];

    // Append history in chronological order (it was fetched newest-first).
    for (const entry of (history ?? []).slice().reverse()) {
      if (entry.role === "system") continue;
      messages.push({
        role: entry.role as "user" | "assistant",
        content: entry.content,
      });
    }

    messages.push({ role: "user", content: message });

    // Stream the answer back to the widget.
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";

        try {
          controller.enqueue(encoder.encode(toSSE({ type: "session", sessionId })));

          if (sources.length) {
            controller.enqueue(encoder.encode(toSSE({ type: "sources", sources })));
          }

          fullText = await streamChatCompletion(messages, (token) => {
            controller.enqueue(
              encoder.encode(toSSE({ type: "delta", content: token })),
            );
          });

          controller.enqueue(encoder.encode(toSSE({ type: "done" })));
        } catch (error) {
          console.error("RAG stream error:", error);
          controller.enqueue(
            encoder.encode(
              toSSE({ type: "error", message: "Failed to generate a response." }),
            ),
          );
        } finally {
          // Persist the assistant reply (when non-empty) with citations.
          if (fullText.trim()) {
            await admin.from("chat_messages").insert({
              organization_id: organizationId,
              session_id: sessionId,
              role: "assistant",
              content: fullText,
              sources: sources.length ? (sources as unknown as Json) : null,
            });
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("RAG chat error:", error);
    return NextResponse.json(
      { error: "Failed to process the chat request." },
      { status: 500 },
    );
  }
}

