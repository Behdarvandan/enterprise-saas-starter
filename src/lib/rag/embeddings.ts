/**
 * Document chunking and embedding pipeline for the RAG module.
 *
 * Embeddings are generated against Google's `gemini-embedding-001` model,
 * pinned to 1536 dimensions. This MUST stay in sync with the pasargad-core RAG
 * query engine (packages/graph/nodes/ops.py): ingest and query have to share
 * one vector space or similarity search returns nothing. The implementation
 * uses a plain `fetch` call so it runs unchanged on both the Node.js and Edge
 * runtimes without pulling in a heavy SDK dependency.
 */

import { z } from "zod";

export const EMBEDDING_MODEL = "gemini-embedding-001";
// Matches the `document_chunks.embedding vector(1536)` column.
export const EMBEDDING_DIMENSIONS = 1536;

const EMBEDDING_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;

// Single-content responses use `embedding`; some API versions return a
// batch-shaped `embeddings` array instead (pasargad-core accepts both too).
const embeddingResponseSchema = z
  .object({
    embedding: z.object({ values: z.array(z.number()) }).optional(),
    embeddings: z.array(z.object({ values: z.array(z.number()) })).optional(),
  })
  .transform((data) => data.embedding?.values ?? data.embeddings?.[0]?.values);

/** A single chunk produced by {@link chunkText}. */
export interface TextChunk {
  /** Zero-based position within the source document. */
  index: number;
  /** The normalized text fragment. */
  content: string;
  /** Approximate token count used for observability. */
  tokenCount: number;
}

/** Rough heuristic: ~4 characters per token for English prose. */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Splits text into overlapping, word-boundary-aware chunks so that semantic
 * context is preserved across boundaries and words are never cut in half.
 */
export function chunkText(
  text: string,
  maxChunkSize = 1000,
  overlap = 200,
): TextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  if (normalized.length <= maxChunkSize) {
    return [
      { index: 0, content: normalized, tokenCount: estimateTokenCount(normalized) },
    ];
  }

  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + maxChunkSize, normalized.length);

    // Rewind to the previous whitespace to avoid splitting a word, unless we
    // have already reached the end of the document.
    if (end < normalized.length) {
      const lastSpace = normalized.lastIndexOf(" ", end);
      if (lastSpace > start) {
        end = lastSpace;
      }
    }

    const content = normalized.slice(start, end).trim();
    if (content) {
      chunks.push({
        index: chunks.length,
        content,
        tokenCount: estimateTokenCount(content),
      });
    }

    if (end >= normalized.length) break;

    // Advance with overlap to retain context across chunk boundaries.
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

/**
 * Generates a 1536-dimensional Gemini embedding vector for the given text.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_API_KEY is not configured. It is required for embedding generation.",
    );
  }

  const response = await fetch(EMBEDDING_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Header auth keeps the key out of URLs (and therefore out of logs).
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      // Explicit: the model's native size is 3072, which would not fit vector(1536).
      outputDimensionality: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Embedding request failed (${response.status}): ${body}`);
  }

  const parsed = embeddingResponseSchema.safeParse(
    await response.json().catch(() => null),
  );

  const embedding = parsed.success ? parsed.data : undefined;
  if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Unexpected embedding response from Gemini (expected ${EMBEDDING_DIMENSIONS} dimensions).`,
    );
  }

  return embedding;
}

/**
 * Runs an async mapper over `items` with bounded concurrency. Used to generate
 * embeddings in parallel without exhausting provider rate limits.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);

  return results;
}
