import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableSlots } from "@/lib/booking";
import { checkRateLimit } from "@/lib/rate-limit";
import { firstIssueMessage } from "@/lib/validation";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const bookingSlotsQuerySchema = z.object({
  organizationId: z.string().uuid("A valid organizationId is required."),
  serviceId: z.string().uuid("A valid serviceId is required."),
  date: z.string().regex(DATE_PATTERN, "A valid date (YYYY-MM-DD) is required."),
});

/**
 * GET /api/booking/slots?organizationId=...&serviceId=...&date=YYYY-MM-DD
 *
 * Returns the bookable time slots for a service on a given day. This endpoint
 * is intentionally public because the customer booking flow is anonymous;
 * `getAvailableSlots` scopes every query to the provided tenant and service.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsedQuery = bookingSlotsQuerySchema.safeParse({
    organizationId: searchParams.get("organizationId") ?? "",
    serviceId: searchParams.get("serviceId") ?? "",
    date: searchParams.get("date") ?? "",
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: firstIssueMessage(parsedQuery.error) },
      { status: 400 },
    );
  }

  const { organizationId, serviceId, date } = parsedQuery.data;

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
