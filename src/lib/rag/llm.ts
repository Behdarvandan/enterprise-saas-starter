/**
 * Streaming LLM completion helper.
 *
 * Prefers Groq (`llama-3.3-70b-versatile`) for low-latency streaming and falls
 * back to OpenAI (`gpt-4o-mini`). Both providers expose an OpenAI-compatible
 * chat-completions endpoint, so a single streaming parser covers both.
 */

import { z } from "zod";

export type LLMRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

interface ProviderConfig {
  url: string;
  model: string;
  headers: Record<string, string>;
}

function resolveProvider(): ProviderConfig {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      headers: { Authorization: `Bearer ${groqKey}` },
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      headers: { Authorization: `Bearer ${openaiKey}` },
    };
  }

  throw new Error(
    "No LLM API key configured. Set GROQ_API_KEY or OPENAI_API_KEY.",
  );
}

const streamDeltaSchema = z.object({
  choices: z
    .array(z.object({ delta: z.object({ content: z.string().optional() }).optional() }))
    .optional(),
  // Only present on the trailing chunk when `stream_options.include_usage`
  // is set — both Groq and OpenAI's chat-completions endpoints support it.
  usage: z
    .object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
    })
    .optional(),
});

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface LLMCompletionResult {
  text: string;
  /** `null` when the provider didn't return a usage chunk. */
  usage: LLMUsage | null;
}

/**
 * Streams a chat completion and invokes `onToken` for each generated token.
 * Resolves with the fully accumulated assistant text and token usage (for
 * the RAG chat quota — see src/lib/rag/quota.ts).
 */
export async function streamChatCompletion(
  messages: LLMMessage[],
  onToken: (token: string) => void,
): Promise<LLMCompletionResult> {
  const provider = resolveProvider();

  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...provider.headers,
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      stream: true,
      stream_options: { include_usage: true },
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => "");
    throw new Error(`LLM request failed (${response.status}): ${body}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let usage: LLMUsage | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;

      try {
        const parsed = streamDeltaSchema.safeParse(JSON.parse(data));
        if (!parsed.success) continue;

        const token = parsed.data.choices?.[0]?.delta?.content ?? "";
        if (token) {
          fullText += token;
          onToken(token);
        }

        if (parsed.data.usage) {
          usage = {
            promptTokens: parsed.data.usage.prompt_tokens,
            completionTokens: parsed.data.usage.completion_tokens,
          };
        }
      } catch {
        // Ignore malformed or keep-alive lines emitted by some providers.
      }
    }
  }

  return { text: fullText, usage };
}
