import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/booking";
import { checkRateLimit } from "@/lib/rate-limit";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/booking/slots?organizationId=...&serviceId=...&date=YYYY-MM-DD
 *
 * Returns the bookable time slots for a service on a given day. This endpoint
 * is intentionally public because the customer booking flow is anonymous;
 * `getAvailableSlots` scopes every query to the provided tenant and service.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const organizationId = searchParams.get("organizationId") ?? "";
  const serviceId = searchParams.get("serviceId") ?? "";
  const date = searchParams.get("date") ?? "";

  if (!organizationId || !serviceId || !DATE_PATTERN.test(date)) {
    return NextResponse.json(
      { error: "organizationId, serviceId, and a valid date are required." },
      { status: 400 },
    );
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const allowed = await checkRateLimit(`booking-slots:${organizationId}:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  try {
    const slots = await getAvailableSlots({ organizationId, serviceId, date });
    return NextResponse.json({ slots });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load available times.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
