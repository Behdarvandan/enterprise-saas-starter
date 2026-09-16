import { createAdminClient } from "@/lib/supabase/admin";

export const DEFAULT_TOKENS_LIMIT = 100_000;

export interface QuotaStatus {
  allowed: boolean;
  tokensUsed: number;
  tokensLimit: number;
}

/**
 * Checks whether an organization is still within its RAG chat token quota.
 * Called from `/api/chat/rag`, which is an anonymous route (the public
 * chat widget has no member session), so this always uses the admin
 * client rather than relying on `is_org_member` RLS.
 *
 * An organization with no `usage_quotas` row yet (created lazily by
 * `incrementTokenUsage` on first use) is treated as having the default
 * limit and zero usage, so quota enforcement never blocks a tenant's very
 * first chat message.
 */
export async function checkQuota(organizationId: string): Promise<QuotaStatus> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("usage_quotas")
    .select("tokens_used, tokens_limit")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) {
    return { allowed: true, tokensUsed: 0, tokensLimit: DEFAULT_TOKENS_LIMIT };
  }

  return {
    allowed: data.tokens_used < data.tokens_limit,
    tokensUsed: data.tokens_used,
    tokensLimit: data.tokens_limit,
  };
}

/**
 * Atomically increments an organization's token usage via the
 * `increment_token_usage` RPC (an upsert, so the row is created on first
 * use). Best-effort: a logging/increment failure never blocks the chat
 * response that already streamed back to the visitor.
 */
export async function incrementTokenUsage(
  organizationId: string,
  tokens: number,
): Promise<void> {
  if (tokens <= 0) return;

  const admin = createAdminClient();
  const { error } = await admin.rpc("increment_token_usage", {
    p_organization_id: organizationId,
    p_tokens: tokens,
  });

  if (error) {
    console.error("Failed to increment token usage:", error);
  }
}
