/** Pure text chunking — no server-only imports, safe to run in the browser. */

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
