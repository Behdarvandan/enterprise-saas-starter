import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TOKENS_LIMIT } from "@/lib/rag/quota";
import {
  deriveAgentState,
  LIVE_WINDOW_MINUTES,
  quotaUsage,
  RAG_WINDOW_DAYS,
  ragSuccessRate,
  type AgentState,
  type QuotaUsage,
} from "@/lib/dashboard/metrics";

export interface OrganizationSnapshot {
  name: string;
  slug: string;
  subscriptionStatus: string;
  planId: string | null;
  currentPeriodEnd: string | null;
  quota: QuotaUsage;
  agentState: AgentState;
}

/**
 * Organization row + token quota + derived agent state, memoised per request
 * so the shell layout and the overview page share one round trip. RLS-scoped
 * (`usage_quotas_select_member` lets members read their own row).
 */
export const getOrganizationSnapshot = cache(
  async (organizationId: string): Promise<OrganizationSnapshot | null> => {
    const supabase = await createClient();

    const [orgResult, quotaResult, agencyLink] = await Promise.all([
      supabase
        .from("organizations")
        .select("name, slug, subscription_status, plan_id, current_period_end")
        .eq("id", organizationId)
        .maybeSingle(),
      supabase
        .from("usage_quotas")
        .select("tokens_used, tokens_limit, period_start")
        .eq("organization_id", organizationId)
        .maybeSingle(),
      supabase
        .from("agency_tenants")
        .select("tenant_id")
        .eq("tenant_id", organizationId)
        .maybeSingle(),
    ]);

    const organization = orgResult.data;
    if (!organization) return null;

    // No row yet means "nothing consumed": the row is created lazily on first use.
    const quota = quotaUsage({
      tokensUsed: quotaResult.data?.tokens_used ?? 0,
      tokensLimit: quotaResult.data?.tokens_limit ?? DEFAULT_TOKENS_LIMIT,
      periodStart: quotaResult.data?.period_start ?? null,
    });

    return {
      name: organization.name,
      slug: organization.slug,
      subscriptionStatus: organization.subscription_status,
      planId: organization.plan_id,
      currentPeriodEnd: organization.current_period_end,
      quota,
      agentState: deriveAgentState({
        subscriptionStatus: organization.subscription_status,
        quota,
        servedByAgency: agencyLink.data !== null,
      }),
    };
  },
);

export interface OverviewMetrics {
  liveChats: number;
  /** 0-100, or null when there were no completions in the window. */
  ragSuccessPercent: number | null;
  ragCompletions: number;
  documents: number;
  bookingsThisWeek: number;
}

/**
 * Live chat / RAG / content counters for the overview. `audit_logs` has no
 * member SELECT policy, so the RAG counters use the service-role client with
 * the explicit organization filter (organizationId must come from
 * `requireMembership`, never from request input).
 */
export async function getOverviewMetrics(organizationId: string): Promise<OverviewMetrics> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const now = Date.now();
  const liveSince = new Date(now - LIVE_WINDOW_MINUTES * 60_000).toISOString();
  const ragSince = new Date(now - RAG_WINDOW_DAYS * 86_400_000).toISOString();
  const weekSince = new Date(now - 7 * 86_400_000).toISOString();

  const completions = () =>
    admin
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("action", "chat.completion")
      .gte("created_at", ragSince);

  const [live, total, lowConfidence, exhausted, documents, bookings] = await Promise.all([
    supabase
      .from("chat_sessions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("updated_at", liveSince),
    completions(),
    completions().eq("metadata->>low_confidence", "true"),
    completions().eq("metadata->>status", "quota_exhausted"),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "ready"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", weekSince),
  ]);

  const ragCompletions = total.count ?? 0;

  return {
    liveChats: live.count ?? 0,
    ragSuccessPercent: ragSuccessRate({
      completions: ragCompletions,
      lowConfidence: lowConfidence.count ?? 0,
      quotaExhausted: exhausted.count ?? 0,
    }),
    ragCompletions,
    documents: documents.count ?? 0,
    bookingsThisWeek: bookings.count ?? 0,
  };
}
