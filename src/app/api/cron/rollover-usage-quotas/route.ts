import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PERIOD_LENGTH_DAYS = 30;

/**
 * GET /api/cron/rollover-usage-quotas
 *
 * Resets `tokens_used` to 0 and advances `period_start` to now for every
 * organization whose current 30-day period has elapsed — a rolling window,
 * not a calendar month, so it needs no timezone handling. Protected by the
 * `CRON_SECRET` bearer token, mirroring
 * /api/cron/cleanup-pending-appointments. Intended to run once a day.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[rollover-usage-quotas] CRON_SECRET is not configured.");
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cutoff = new Date(
    Date.now() - PERIOD_LENGTH_DAYS * 24 * 60 * 60_000,
  ).toISOString();

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("usage_quotas")
    .update({ tokens_used: 0, period_start: new Date().toISOString() })
    .lt("period_start", cutoff)
    .select("id");

  if (error) {
    console.error(
      "[rollover-usage-quotas] Failed to roll over usage quotas:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to roll over usage quotas." },
      { status: 500 },
    );
  }

  return NextResponse.json({ rolledOver: data?.length ?? 0 });
}
