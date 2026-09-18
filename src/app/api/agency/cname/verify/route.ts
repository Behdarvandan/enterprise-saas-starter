import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiErrorHandling } from "@/lib/api-error";
import {
  DnsLookupError,
  invalidateAgencyDomainCache,
  verifyCnameRecord,
} from "@/lib/agency/cname";
import { requireMembershipOrResponse } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { firstIssueMessage, postgresUuid } from "@/lib/validation";

const verifyRequestSchema = z.object({
  agencyId: postgresUuid("A valid agencyId is required."),
});

/**
 * POST /api/agency/cname/verify
 * Tests an agency's custom-domain CNAME and records the outcome
 * (`pending` | `active` | `failed`). Only an agency admin (or the operator)
 * can verify: the agency row is read with the caller's own RLS-bound client,
 * so anyone else gets a 404 that doesn't reveal whether the agency exists.
 * Only an `active` domain is served white-labelled by the middleware.
 */
export const POST = withApiErrorHandling(
  "Agency CNAME verification error",
  "Failed to verify the domain.",
  async (request: Request) => {
    const auth = await requireMembershipOrResponse();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const parsed = verifyRequestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });
    }
    const { agencyId } = parsed.data;

    // Each check is a live DNS query against a third-party resolver.
    const allowed = await checkRateLimit(`agency-cname-verify:${user.id}`);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 },
      );
    }

    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("id, cname_domain")
      .eq("id", agencyId)
      .maybeSingle();
    if (agencyError) throw agencyError;

    if (!agency) {
      return NextResponse.json({ error: "Agency not found." }, { status: 404 });
    }
    if (!agency.cname_domain) {
      return NextResponse.json(
        { error: "This agency has no custom domain configured." },
        { status: 400 },
      );
    }

    let verification;
    try {
      verification = await verifyCnameRecord(agency.cname_domain);
    } catch (error) {
      if (error instanceof DnsLookupError) {
        // Resolver trouble says nothing about the domain: keep the stored
        // status and let the caller retry.
        console.warn("Agency CNAME verification could not query DNS:", error);
        return NextResponse.json(
          { error: "Could not reach the DNS resolver. Please try again." },
          { status: 502 },
        );
      }
      throw error;
    }

    // `agencies` has no agency-admin write policy (only the operator may
    // edit it), so the verdict is recorded with the service-role client,
    // limited to the two verification columns.
    const { error: updateError } = await createAdminClient()
      .from("agencies")
      .update({
        cname_status: verification.status,
        cname_verified_at: verification.status === "active" ? new Date().toISOString() : null,
      })
      .eq("id", agency.id);
    if (updateError) throw updateError;

    await invalidateAgencyDomainCache(agency.cname_domain);

    return NextResponse.json({
      status: verification.status,
      domain: agency.cname_domain,
      target: verification.target,
    });
  },
);
