/**
 * Document chunking and embedding pipeline for the RAG module.
 *
 * Embeddings are generated against OpenAI's `text-embedding-3-small` model
 * (1536 dimensions). The implementation uses a plain `fetch` call so it runs
 * unchanged on both the Node.js and Edge runtimes without pulling in a heavy
 * SDK dependency.
 */

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

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
 * Generates a 1536-dimensional embedding vector for the given text.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. It is required for embedding generation.",
    );
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Embedding request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    data: { embedding: number[] }[];
  };

  const embedding = data.data?.[0]?.embedding;
  if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("Unexpected embedding response from OpenAI.");
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
