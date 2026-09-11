import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/cleanup-pending-appointments
 *
 * Safety net for cases where the `checkout.session.expired` webhook was never
 * delivered (e.g. a Stripe webhook outage or misconfiguration). A `pending`
 * appointment holds a booking slot for up to 30 minutes while the customer
 * completes Stripe Checkout; if that session expires without the webhook
 * firing, the slot would otherwise stay "pending" (and blocked) indefinitely.
 *
 * This endpoint cancels every `pending` appointment older than 35 minutes — a
 * 5-minute buffer over the 30-minute Stripe session expiry so we don't race a
 * session that is about to legitimately confirm. It is protected by the
 * `CRON_SECRET` bearer token and intended to be called every 10-15 minutes by
 * an external scheduler.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error(
      "[cleanup-pending-appointments] CRON_SECRET is not configured.",
    );
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // 35-minute cutoff: only cancels appointments whose 30-minute Stripe
  // Checkout session should already have expired, plus a 5-minute grace buffer.
  const cutoff = new Date(Date.now() - 35 * 60_000).toISOString();

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    console.error(
      "[cleanup-pending-appointments] Failed to cancel stale pending appointments:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to clean up pending appointments." },
      { status: 500 },
    );
  }

  return NextResponse.json({ cancelled: data?.length ?? 0 });
}
