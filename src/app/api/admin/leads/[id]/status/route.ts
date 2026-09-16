import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOperatorAdminOrResponse } from "@/lib/operator";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiErrorHandling } from "@/lib/api-error";
import { firstIssueMessage } from "@/lib/validation";

const statusSchema = z.object({
  status: z.enum(["new", "contacted", "quoted", "accepted", "rejected"]),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/leads/[id]/status
 *
 * Uses the service-role client (not the caller's RLS-scoped one) because
 * this write is bundled atomically with a `write_audit_log` call, which is
 * itself grant-restricted to `service_role` only — matching the pattern in
 * src/lib/payment/handlers.ts for other privileged, audited writes.
 */
export const PATCH = withApiErrorHandling(
  "Lead status update error",
  "Failed to update the lead's status.",
  async (request: Request, { params }: RouteParams) => {
    const { id } = await params;

    const result = await requireOperatorAdminOrResponse();
    if ("response" in result) return result.response;
    const { user } = result;

    const parsedBody = statusSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: firstIssueMessage(parsedBody.error) },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    const { data: lead, error } = await admin
      .from("leads")
      .update({ status: parsedBody.data.status })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error || !lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    await admin.rpc("write_audit_log", {
      p_action: "lead.status_changed",
      p_organization_id: lead.organization_id,
      p_actor_id: user.id,
      p_target_table: "leads",
      p_target_id: lead.id,
      p_metadata: { status: parsedBody.data.status },
    });

    return NextResponse.json({ lead });
  },
);
