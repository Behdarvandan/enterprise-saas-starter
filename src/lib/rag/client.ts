import type { RagErrorCode } from "@/lib/rag/schemas";
import type { DocumentListItem, IngestChunk, RagSearchHit } from "@/types";

/** Browser-side client for `/api/rag/*`. Errors carry the route's stable `code`. */
export class RagApiError extends Error {
  constructor(
    readonly code: RagErrorCode | "network",
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "RagApiError";
  }
}

interface ErrorBody {
  error?: string;
  code?: RagErrorCode;
}

function toError(status: number, body: unknown): RagApiError {
  const { error, code } = (body ?? {}) as ErrorBody;
  return new RagApiError(code ?? "server_error", status, error ?? `Request failed (${status})`);
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    throw new RagApiError("network", 0, error instanceof Error ? error.message : "Network error");
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw toError(response.status, body);
  return body as T;
}

export async function fetchDocuments(signal?: AbortSignal): Promise<DocumentListItem[]> {
  const { documents } = await request<{ documents: DocumentListItem[] }>("/api/rag/ingest", { signal });
  return documents;
}

export async function deleteDocuments(
  documentIds: string[],
): Promise<{ deleted: number; notFound: string[] }> {
  return request("/api/rag/ingest", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentIds }),
  });
}

export async function ingestText(input: {
  title: string;
  content: string;
}): Promise<{ documentId: string; chunkCount: number }> {
  return request("/api/rag/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, sourceType: "text" }),
  });
}

export async function fetchChunks(
  documentId: string,
  cursor: number,
  signal?: AbortSignal,
): Promise<{ chunks: IngestChunk[]; nextCursor: number | null }> {
  const params = new URLSearchParams({ documentId, cursor: String(cursor) });
  return request(`/api/rag/ingest/chunks?${params.toString()}`, { signal });
}

export async function searchKnowledgeBase(
  query: string,
  signal?: AbortSignal,
): Promise<{ hits: RagSearchHit[]; params: { topK: number; threshold: number } }> {
  return request("/api/rag/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    signal,
  });
}

export interface UploadHandlers {
  /** 0-100 of the request body sent. */
  onProgress: (percent: number) => void;
  /** All bytes are sent; the server is now chunking and embedding. */
  onProcessing: () => void;
  signal?: AbortSignal;
}

/**
 * Uploads a file with byte-level progress. `fetch` cannot report upload
 * progress, so this uses XHR; the server responds only after embedding
 * finishes, which is why "processing" is a distinct phase after 100%.
 */
export function uploadFile(
  file: File,
  { onProgress, onProcessing, signal }: UploadHandlers,
): Promise<{ documentId: string; chunkCount: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.upload.onload = () => {
      onProgress(100);
      onProcessing();
    };
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch (error) {
        console.warn("[rag] upload response was not JSON:", error);
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as { documentId: string; chunkCount: number });
      else reject(toError(xhr.status, body));
    };
    xhr.onerror = () => reject(new RagApiError("network", 0, "Network error"));
    xhr.onabort = () => reject(new RagApiError("network", 0, "Upload cancelled"));

    signal?.addEventListener("abort", () => xhr.abort(), { once: true });

    xhr.open("POST", "/api/rag/ingest");
    xhr.send(form);
  });
}
