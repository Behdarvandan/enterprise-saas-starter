export interface StreamAgentOptions {
  message: string;
  jwt?: string;
  tenantId?: string;
  agentId?: string;
  signal?: AbortSignal;
}

const STREAM_PATH = "/api/v1/agent/stream";

/** Opens an SSE stream to the pasargad-core agent gateway; caller owns piping the ReadableStream to a Response. */
export async function streamPasargadAgent(options: StreamAgentOptions): Promise<ReadableStream<Uint8Array>> {
  const baseUrl = process.env.NEXT_PUBLIC_PASARGAD_API_URL ?? "http://localhost:8000";
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "text/event-stream" };
  if (options.jwt) headers.Authorization = `Bearer ${options.jwt}`;
  if (options.tenantId) headers["X-Tenant-ID"] = options.tenantId;

  const response = await fetch(`${baseUrl}${STREAM_PATH}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message: options.message, agentId: options.agentId }),
    signal: options.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`[core/api] pasargad agent stream request failed with status ${response.status}`);
  }
  return response.body;
}
