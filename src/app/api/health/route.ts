import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness probe (Docker HEALTHCHECK, load balancers). Intentionally minimal:
 * this endpoint is unauthenticated, so it must not disclose process uptime,
 * environment or version details that help fingerprint the deployment.
 */
export async function GET() {
  return NextResponse.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
