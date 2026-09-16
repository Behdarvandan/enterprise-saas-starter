import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createAnonClient } from "@/lib/supabase/anon";
import { isOrganizationServiceable } from "@/lib/billing";
import { getEmbedding } from "@/lib/rag/embeddings";
import { streamChatCompletion, type LLMMessage } from "@/lib/rag/llm";
import { checkQuota, incrementTokenUsage } from "@/lib/rag/quota";
import { checkRateLimit } from "@/lib/rate-limit";
import { firstIssueMessage } from "@/lib/validation";
import type { ChatMatchSource, ChatRequestBody, ChatStreamEvent, Json } from "@/types";

const MATCH_COUNT = 5;
const MATCH_THRESHOLD = 0.5;
const HISTORY_LIMIT = 12;
const MAX_MESSAGE_LENGTH = 4000;

const chatRequestSchema = z.object({
  organizationId: z.string().uuid("A valid organizationId is required."),
  sessionId: z.string().uuid().nullable().optional(),
  message: z.string().trim().min(1, "A message is required."),
}) satisfies z.ZodType<ChatRequestBody>;

/** Serializes a JSON payload as a Server-Sent Events `data:` frame. */
function toSSE(payload: ChatStreamEvent): string {
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

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const allowed = await checkRateLimit(`rag-history:${organizationId}:${ip}`);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 },
      );
    }

    const anon = createAnonClient();

    // Confirm the session belongs to the requested tenant before returning data.
    const { data: session } = await anon.rpc("get_chat_session_for_org", {
      p_organization_id: organizationId,
      p_session_id: sessionId,
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const { data: history, error } = await anon
      .rpc("get_chat_history", {
        p_organization_id: organizationId,
        p_session_id: sessionId,
      })
      .order("created_at", { ascending: true });

    if (error) throw error;

    const messages = (history ?? []).map((entry) => ({
      id: entry.id,
      role: entry.role,
      content: entry.content,
      created_at: entry.created_at,
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("RAG chat history error:", error);
    Sentry.captureException(error);
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
 * as Server-Sent Events. Runs on the anon-key client because visitors are
 * anonymous; tenant isolation is enforced inside each `SECURITY DEFINER` RPC
 * (`get_chat_session_for_org`, `create_chat_session`, `get_chat_history`,
 * `insert_chat_message`, `match_document_chunks`), not by TypeScript filters
 * alone.
 */
export async function POST(request: Request) {
  const parsedBody = chatRequestSchema.safeParse(
    await request.json().catch(() => ({})),
  );

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: firstIssueMessage(parsedBody.error) },
      { status: 400 },
    );
  }

  const { organizationId, message } = parsedBody.data;

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: "Message exceeds the maximum allowed length." },
      { status: 413 },
    );
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const allowed = await checkRateLimit(`rag:${organizationId}:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  const anon = createAnonClient();

  try {
    // Only serve tenants with an active or trialing subscription.
    if (!(await isOrganizationServiceable(organizationId))) {
      return NextResponse.json(
        { error: "This service is not currently available." },
        { status: 403 },
      );
    }

    const quota = await checkQuota(organizationId);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `This organization has reached its AI assistant token quota (${quota.tokensUsed}/${quota.tokensLimit}). Contact support to increase the limit.`,
        },
        { status: 429 },
      );
    }

    // Resolve or create a session scoped strictly to the tenant.
    let sessionId = parsedBody.data.sessionId ?? null;

    if (sessionId) {
      const { data: existing } = await anon.rpc("get_chat_session_for_org", {
        p_organization_id: organizationId,
        p_session_id: sessionId,
      });

      // A missing or cross-tenant session id is discarded.
      if (!existing) sessionId = null;
    }

    if (!sessionId) {
      const { data: created, error } = await anon.rpc("create_chat_session", {
        p_organization_id: organizationId,
      });

      if (error || !created) {
        throw error ?? new Error("Failed to create the chat session.");
      }

      sessionId = created.id;
    }

    // Persist the visitor's message.
    const { error: userMessageError } = await anon.rpc("insert_chat_message", {
      p_organization_id: organizationId,
      p_session_id: sessionId,
      p_role: "user",
      p_content: message,
    });

    if (userMessageError) throw userMessageError;

    // Recent conversation history (newest first) for context.
    const { data: historyRows } = await anon
      .rpc("get_chat_history", {
        p_organization_id: organizationId,
        p_session_id: sessionId,
      })
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);

    const history = (historyRows ?? []).map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));

    // Retrieve the most relevant knowledge chunks for the tenant.
    const queryEmbedding = await getEmbedding(message);
    const { data: matches, error: matchError } = await anon.rpc(
      "match_document_chunks",
      {
        query_embedding: queryEmbedding,
        match_organization_id: organizationId,
        match_count: MATCH_COUNT,
        match_threshold: MATCH_THRESHOLD,
      },
    );

    if (matchError) throw matchError;

    const sources: ChatMatchSource[] = (matches ?? []).map((match) => ({
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
    for (const entry of history.slice().reverse()) {
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
        let usage: Awaited<ReturnType<typeof streamChatCompletion>>["usage"] = null;

        try {
          controller.enqueue(encoder.encode(toSSE({ type: "session", sessionId })));

          if (sources.length) {
            controller.enqueue(encoder.encode(toSSE({ type: "sources", sources })));
          }

          const result = await streamChatCompletion(messages, (token) => {
            controller.enqueue(
              encoder.encode(toSSE({ type: "delta", content: token })),
            );
          });
          fullText = result.text;
          usage = result.usage;

          controller.enqueue(encoder.encode(toSSE({ type: "done" })));
        } catch (error) {
          console.error("RAG stream error:", error);
          Sentry.captureException(error, { extra: { organizationId, sessionId } });
          controller.enqueue(
            encoder.encode(
              toSSE({ type: "error", message: "Failed to generate a response." }),
            ),
          );
        } finally {
          // Persist the assistant reply (when non-empty) with citations.
          if (fullText.trim()) {
            await anon.rpc("insert_chat_message", {
              p_organization_id: organizationId,
              p_session_id: sessionId,
              p_role: "assistant",
              p_content: fullText,
              p_sources: sources.length ? (sources as unknown as Json) : null,
            });
          }
          // Best-effort — a missing usage chunk (some providers/configs)
          // just means this exchange isn't metered, not a hard failure.
          if (usage) {
            await incrementTokenUsage(
              organizationId,
              usage.promptTokens + usage.completionTokens,
            );
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
    Sentry.captureException(error, { extra: { organizationId } });
    return NextResponse.json(
      { error: "Failed to process the chat request." },
      { status: 500 },
    );
  }
}
