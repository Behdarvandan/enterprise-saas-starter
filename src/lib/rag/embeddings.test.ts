import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  chunkText,
  getEmbedding,
  mapWithConcurrency,
} from "@/lib/rag/embeddings";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function vectorOf(length: number): number[] {
  return Array.from({ length }, (_, i) => i / length);
}

describe("getEmbedding", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("GOOGLE_API_KEY", "test-google-key");
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("pins the model and dimensions to the pasargad-core query engine", () => {
    expect(EMBEDDING_MODEL).toBe("gemini-embedding-001");
    expect(EMBEDDING_DIMENSIONS).toBe(1536);
  });

  it("throws a descriptive error when GOOGLE_API_KEY is missing", async () => {
    vi.stubEnv("GOOGLE_API_KEY", "");

    await expect(getEmbedding("hello")).rejects.toThrow(/GOOGLE_API_KEY is not configured/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls Gemini embedContent with explicit 1536 outputDimensionality", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ embedding: { values: vectorOf(1536) } }),
    );

    const result = await getEmbedding("merhaba dünya");

    expect(result).toHaveLength(1536);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent",
    );
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ "x-goog-api-key": "test-google-key" });
    expect(JSON.parse(String(init?.body))).toEqual({
      content: { parts: [{ text: "merhaba dünya" }] },
      outputDimensionality: 1536,
    });
  });

  it("does not leak the API key into the request URL", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ embedding: { values: vectorOf(1536) } }),
    );

    await getEmbedding("hello");

    expect(String(fetchMock.mock.calls[0][0])).not.toContain("test-google-key");
  });

  it("accepts the batch-shaped `embeddings` response", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ embeddings: [{ values: vectorOf(1536) }] }),
    );

    await expect(getEmbedding("hello")).resolves.toHaveLength(1536);
  });

  it("rejects vectors that are not 1536-dimensional", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ embedding: { values: vectorOf(3072) } }),
    );

    await expect(getEmbedding("hello")).rejects.toThrow(/Unexpected embedding response/);
  });

  it("rejects malformed responses", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ unexpected: true }));

    await expect(getEmbedding("hello")).rejects.toThrow(/Unexpected embedding response/);
  });

  it("surfaces the status and body of failed requests", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("API key not valid", { status: 400 }),
    );

    await expect(getEmbedding("hello")).rejects.toThrow(
      /Embedding request failed \(400\): API key not valid/,
    );
  });
});

describe("chunkText", () => {
  it("returns no chunks for blank input", () => {
    expect(chunkText("   \n ")).toEqual([]);
  });

  it("keeps short text as a single chunk", () => {
    const chunks = chunkText("short text");

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ index: 0, content: "short text" });
  });

  it("splits long text on word boundaries with sequential indexes", () => {
    const text = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
    const chunks = chunkText(text, 200, 40);

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk, i) => {
      expect(chunk.index).toBe(i);
      expect(chunk.content.length).toBeLessThanOrEqual(200);
    });
  });
});

describe("mapWithConcurrency", () => {
  it("preserves order and never exceeds the concurrency limit", async () => {
    let active = 0;
    let peak = 0;

    const results = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (n) => {
      active++;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active--;
      return n * 2;
    });

    expect(results).toEqual([2, 4, 6, 8, 10, 12]);
    expect(peak).toBeLessThanOrEqual(2);
  });
});
