import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireMembershipOrResponse } from "@/lib/auth";
import { canRotateApiKey } from "@/lib/team";
import { withApiErrorHandling } from "@/lib/api-error";

/**
 * POST /api/client/license/rotate
 *
 * Self-serve API key rotation for the caller's own organization. Uses the
 * RLS-scoped client (not the admin client): `saas_subscriptions_update_own_
 * admin` already restricts this update to an owner/admin of the row's own
 * organization, so the DB enforces the same rule this route checks in code
 * — the `canRotateApiKey` check here is defense in depth, matching the
 * cross-tenant checks used elsewhere (e.g. the invoice PDF route).
 *
 * Only the key's hash is ever persisted; the raw key is returned once in
 * the response and never stored or logged.
 */
export const POST = withApiErrorHandling(
  "License key rotation error",
  "Failed to rotate the API key.",
  async () => {
    const result = await requireMembershipOrResponse();
    if ("response" in result) return result.response;

    const { supabase, membership } = result;

    if (!canRotateApiKey(membership.role)) {
      return NextResponse.json(
        { error: "You don't have permission to rotate this key." },
        { status: 403 },
      );
    }

    const rawKey = crypto.randomBytes(24).toString("hex");
    const apiKeyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const { error } = await supabase
      .from("saas_subscriptions")
      .update({ api_key_hash: apiKeyHash })
      .eq("organization_id", membership.organizationId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to rotate the API key." },
        { status: 400 },
      );
    }

    return NextResponse.json({ apiKey: rawKey });
  },
);
