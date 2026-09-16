import { NextResponse } from "next/server";
import { requireOperatorAdminOrResponse } from "@/lib/operator";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiErrorHandling } from "@/lib/api-error";
import { getBaseUrl } from "@/lib/url";
import { sendInvitationEmail } from "@/lib/email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/leads/[id]/send-invite
 *
 * Sends (or resends) the owner invitation email for a lead that has already
 * been converted via /convert. Split into its own step per brief §5.3 —
 * "Client oluşturuldu. Davet e-postası gönderilsin mi?" — so the operator
 * can decline immediately and send later without re-running the conversion.
 * Safe to call more than once: it always re-sends to whatever invitation is
 * still pending, it doesn't create a new one.
 */
export const POST = withApiErrorHandling(
  "Lead invite send error",
  "Failed to send the invitation email.",
  async (_request: Request, { params }: RouteParams) => {
    const { id } = await params;

    const result = await requireOperatorAdminOrResponse();
    if ("response" in result) return result.response;
    const { user } = result;

    const admin = createAdminClient();

    const { data: lead } = await admin
      .from("leads")
      .select("id, email")
      .eq("id", id)
      .maybeSingle();

    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const { data: project } = await admin
      .from("client_projects")
      .select("organization_id")
      .eq("lead_id", lead.id)
      .maybeSingle();

    if (!project) {
      return NextResponse.json(
        { error: "This lead has not been converted to a client yet." },
        { status: 409 },
      );
    }

    const { data: organization } = await admin
      .from("organizations")
      .select("id, name")
      .eq("id", project.organization_id)
      .maybeSingle();

    const { data: invitation } = await admin
      .from("invitations")
      .select("token, role")
      .eq("organization_id", project.organization_id)
      .eq("email", lead.email)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (!organization || !invitation) {
      return NextResponse.json(
        { error: "No pending invitation found for this client." },
        { status: 404 },
      );
    }

    const baseUrl = await getBaseUrl();
    await sendInvitationEmail({
      to: lead.email,
      organizationName: organization.name,
      role: invitation.role,
      inviteUrl: `${baseUrl}/invite/${invitation.token}`,
    });

    await admin.rpc("write_audit_log", {
      p_action: "lead.invite_sent",
      p_organization_id: organization.id,
      p_actor_id: user.id,
      p_target_table: "invitations",
      p_target_id: null,
      p_metadata: { lead_id: lead.id },
    });

    return NextResponse.json({ success: true });
  },
);
