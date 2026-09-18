import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createAnonClient } from "@/lib/supabase/anon";
import { isOrganizationServiceable } from "@/lib/billing";
import { checkRateLimit } from "@/lib/rate-limit";
import { firstIssueMessage, postgresUuid } from "@/lib/validation";
import type { ChatRequestBody, ChatStreamEvent } from "@/types";

/**
 * The Pasargad FastAPI backend now owns RAG retrieval + LLM generation. This
 * route is a thin proxy: validate the anonymous chat request, forward it to
 * `POST /api/v1/chat/completions` (organization_id -> tenant_id), and re-emit
 * the answer as Server-Sent Events so the widget protocol stays unchanged.
 * When the backend is unreachable it degrades to a safe fallback answer.
 */
const PASARGAD_API_URL =
  process.env.PASARGAD_API_URL ?? "http://localhost:8000";
const PASARGAD_COMPLETIONS_PATH = "/api/v1/chat/completions";
const PASARGAD_TIMEOUT_MS = 30_000;

const FALLBACK_ANSWER =
  "Üzgünüm, şu anda talebinizi işleyemiyorum. Lütfen biraz sonra tekrar deneyin veya destek ekibimizle iletişime geçin.";

const MAX_MESSAGE_LENGTH = 4000;

const chatRequestSchema = z.object({
  organizationId: postgresUuid("A valid organizationId is required."),
  sessionId: postgresUuid().nullable().optional(),
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

interface PasargadExecutionResult {
  crew?: string;
  status?: string;
  answer?: string;
  recommendation?: string;
  [key: string]: unknown;
}

interface PasargadCompletionResponse {
  tenant_id?: string;
  session_id?: string;
  assigned_crew?: string;
  execution_result?: PasargadExecutionResult | null;
}

/**
 * Forwards one chat turn to the Pasargad backend and extracts the answer.
 * OPS turns return `execution_result.answer`; DEV turns (error reports) return
 * a `recommendation` instead. Falls back to `FALLBACK_ANSWER` when neither is
 * present. Throws on transport errors so the caller can apply the fallback.
 */
async function requestPasargadCompletion(payload: {
  tenant_id: string;
  session_id: string;
  user_input: string;
}): Promise<{ answer: string }> {
  const response = await fetch(
    `${PASARGAD_API_URL}${PASARGAD_COMPLETIONS_PATH}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(PASARGAD_TIMEOUT_MS),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Pasargad API error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as PasargadCompletionResponse;
  const result: PasargadExecutionResult = data.execution_result ?? {};

  const answer =
    typeof result.answer === "string" && result.answer.trim()
      ? result.answer
      : typeof result.recommendation === "string" && result.recommendation.trim()
        ? result.recommendation
        : FALLBACK_ANSWER;

  return { answer };
}

/**
 * POST /api/chat/rag
 * Thin proxy to the Pasargad FastAPI backend. This route validates the
 * anonymous chat request, forwards it to `POST /api/v1/chat/completions`
 * (mapping `organization_id -> tenant_id`), and re-emits the backend's answer
 * as Server-Sent Events so the widget's wire protocol is unchanged. When the
 * backend is unreachable the route degrades to a safe fallback answer instead
 * of failing the synchronous user flow.
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

    // Persist the visitor's message so GET history restore keeps working.
    const { error: userMessageError } = await anon.rpc("insert_chat_message", {
      p_organization_id: organizationId,
      p_session_id: sessionId,
      p_role: "user",
      p_content: message,
    });

    if (userMessageError) throw userMessageError;

    // Strict tenant mapping: the organization_id resolved above is forwarded
    // to Pasargad as tenant_id. The backend is the single source of truth for
    // RAG retrieval + LLM generation.
    let answer: string;
    try {
      answer = (
        await requestPasargadCompletion({
          tenant_id: organizationId,
          session_id: sessionId,
          user_input: message,
        })
      ).answer;
    } catch (error) {
      console.error("Pasargad backend unreachable; using fallback answer:", error);
      Sentry.captureException(error, { extra: { organizationId, sessionId } });
      answer = FALLBACK_ANSWER;
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(toSSE({ type: "session", sessionId })));
          controller.enqueue(encoder.encode(toSSE({ type: "delta", content: answer })));
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
          // Persist the assistant reply (when non-empty).
          if (answer.trim()) {
            await anon.rpc("insert_chat_message", {
              p_organization_id: organizationId,
              p_session_id: sessionId,
              p_role: "assistant",
              p_content: answer,
              p_sources: null,
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
    Sentry.captureException(error, { extra: { organizationId } });
    return NextResponse.json(
      { error: "Failed to process the chat request." },
      { status: 500 },
    );
  }
}
