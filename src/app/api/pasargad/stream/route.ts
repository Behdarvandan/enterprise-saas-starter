import { z } from "zod";
import { streamPasargadAgent } from "@/core/api";

export const dynamic = "force-dynamic";

const streamRequestSchema = z.object({
  message: z.string().trim().min(1, "A message is required."),
  agentId: z.string().optional(),
});

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const tenantId = request.headers.get("X-Tenant-ID");

  if (!authHeader?.startsWith("Bearer ") || !tenantId) {
    return new Response(JSON.stringify({ error: "Authorization Bearer token and X-Tenant-ID header are required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const jwt = authHeader.slice("Bearer ".length);

  const parsed = streamRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message ?? "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const stream = await streamPasargadAgent({
      message: parsed.data.message,
      agentId: parsed.data.agentId,
      jwt,
      tenantId,
      signal: request.signal,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[api/pasargad/stream] upstream agent stream failed:", error);
    return new Response(JSON.stringify({ error: "Upstream agent stream failed." }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
