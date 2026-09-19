import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiErrorHandling } from "@/lib/api-error";
import { requireMembershipOrResponse } from "@/lib/auth";
import { fetchCrewInsights } from "@/lib/dev-crew/queries";

// Timestamps come back from Postgres with microsecond precision; z.iso.datetime accepts that.
const timestamp = z.iso.datetime({ offset: true });

const querySchema = z.object({
  since: timestamp.optional(),
  before: timestamp.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * GET /api/crew-insights?since=&before=&limit=
 * The caller's organization's Dev Crew recommendations, newest first.
 * `since` returns only newer rows (live polling); `before` pages backwards.
 */
export const GET = withApiErrorHandling(
  "Crew insights error",
  "Failed to load insights.",
  async (request: Request) => {
    const auth = await requireMembershipOrResponse();
    if ("response" in auth) return auth.response;

    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query.", code: "invalid_body" }, { status: 400 });
    }
    const { since, before, limit } = parsed.data;

    // One extra row tells the client whether an older page exists.
    const rows = await fetchCrewInsights(auth.membership.organizationId, {
      limit: limit + 1,
      since,
      before,
    });

    return NextResponse.json({ insights: rows.slice(0, limit), hasMore: rows.length > limit });
  },
);
