import { NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/security";

/**
 * Shared `CRON_SECRET` bearer-token guard for scheduler-triggered Route
 * Handlers. Returns a ready-to-send error response when the request must be
 * rejected, or `null` when it is authorized.
 *
 * Fails closed: an unset secret is a 500 (misconfiguration), never an open
 * endpoint, and the token comparison is constant-time.
 */
export function authorizeCronRequest(request: Request, label: string): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error(`[${label}] CRON_SECRET is not configured.`);
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }

  if (!verifyBearerToken(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}
