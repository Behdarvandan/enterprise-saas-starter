import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireOperatorAdminOrResponse } from "@/lib/operator";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiErrorHandling } from "@/lib/api-error";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/leads/[id]/convert
 *
 * Converts an accepted lead into a real tenant: creates a fresh
 * single-tenant organization for them (they have no auth.users account yet,
 * so `create_organization()`'s "caller becomes owner" RPC doesn't apply
 * here — the org is inserted directly via the service-role client), links a
 * `client_projects` row so their project immediately shows up in both the
 * admin CRM and their future client portal, and creates a pending "owner"
 * invitation row. The invite EMAIL is deliberately not sent here — per
 * brief §5.3, creating the client and sending the invite are two separate,
 * explicit steps ("Client oluşturuldu. Davet e-postası gönderilsin mi?"),
 * handled by a follow-up call to `/api/admin/leads/[id]/send-invite`.
 *
 * Idempotent: refuses to convert the same lead twice.
 */
export const POST = withApiErrorHandling(
  "Lead conversion error",
  "Failed to convert the lead.",
  async (_request: Request, { params }: RouteParams) => {
    const { id } = await params;

    const result = await requireOperatorAdminOrResponse();
    if ("response" in result) return result.response;
    const { user } = result;

    const admin = createAdminClient();

    const { data: lead } = await admin
      .from("leads")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const { data: existingProject } = await admin
      .from("client_projects")
      .select("id, organization_id")
      .eq("lead_id", lead.id)
      .maybeSingle();

    if (existingProject) {
      return NextResponse.json(
        { error: "This lead has already been converted." },
        { status: 409 },
      );
    }

    const orgName = lead.company?.trim() || lead.full_name;
    const localPart = lead.email.split("@")[0] ?? "client";
    const slug = `${localPart}-${randomBytes(4).toString("hex")}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");

    const { data: organization, error: orgError } = await admin
      .from("organizations")
      .insert({ name: orgName, slug })
      .select()
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: "Failed to create the client organization." },
        { status: 500 },
      );
    }

    const { data: project, error: projectError } = await admin
      .from("client_projects")
      .insert({
        organization_id: organization.id,
        lead_id: lead.id,
        name: lead.project_scope?.slice(0, 80) || `${orgName} project`,
      })
      .select()
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Failed to create the client project." },
        { status: 500 },
      );
    }

    // Creates the pending "owner" invitation row (reusing the same table the
    // team invite flow uses) but does not send the email — that's a
    // separate, explicit step via /send-invite.
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error: invitationError } = await admin.from("invitations").insert({
      organization_id: organization.id,
      email: lead.email,
      role: "owner",
      token,
      expires_at: expiresAt,
      status: "pending",
    });

    if (invitationError) {
      console.error("Failed to create lead-conversion invitation:", invitationError);
    }

    await admin.from("leads").update({ status: "accepted" }).eq("id", lead.id);

    await admin.rpc("write_audit_log", {
      p_action: "lead.converted",
      p_organization_id: organization.id,
      p_actor_id: user.id,
      p_target_table: "leads",
      p_target_id: lead.id,
      p_metadata: { project_id: project.id, organization_id: organization.id },
    });

    return NextResponse.json({
      organizationId: organization.id,
      projectId: project.id,
    });
  },
);
