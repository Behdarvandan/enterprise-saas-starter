/** Pure metric calculations for the executive overview (no I/O — see queries.ts). */

/** A chat session counts as "live" when it had activity within this window. */
export const LIVE_WINDOW_MINUTES = 5;
/** Look-back for the RAG answer success rate. */
export const RAG_WINDOW_DAYS = 30;
/** `usage_quotas` rolls over on a rolling period of this length (see the rollover cron). */
export const QUOTA_PERIOD_DAYS = 30;
/** A quota at or above this share is flagged as running low. */
export const QUOTA_LOW_PERCENT = 80;

export interface RagCounts {
  completions: number;
  lowConfidence: number;
  quotaExhausted: number;
}

/**
 * Share (0-100) of chat completions that produced a grounded answer, i.e.
 * neither a low-confidence fallback nor a quota-blocked reply. Null when
 * there were no completions — "no data" must not read as 0% or 100%.
 */
export function ragSuccessRate({
  completions,
  lowConfidence,
  quotaExhausted,
}: RagCounts): number | null {
  if (completions <= 0) return null;
  const answered = Math.max(completions - lowConfidence - quotaExhausted, 0);
  return Math.min(100, (answered / completions) * 100);
}

export type QuotaTone = "primary" | "warn" | "error";

export interface QuotaUsage {
  tokensUsed: number;
  tokensLimit: number;
  percent: number;
  remaining: number;
  /** When the current period rolls over, or null if the period start is unknown. */
  resetsAt: Date | null;
  tone: QuotaTone;
}

export function quotaUsage(input: {
  tokensUsed: number;
  tokensLimit: number;
  periodStart: string | null;
}): QuotaUsage {
  const { tokensUsed, tokensLimit, periodStart } = input;
  const percent = tokensLimit > 0 ? Math.min(100, (tokensUsed / tokensLimit) * 100) : 0;

  let resetsAt: Date | null = null;
  if (periodStart) {
    const start = new Date(periodStart);
    if (!Number.isNaN(start.getTime())) {
      resetsAt = new Date(start.getTime() + QUOTA_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    }
  }

  return {
    tokensUsed,
    tokensLimit,
    percent,
    remaining: Math.max(tokensLimit - tokensUsed, 0),
    resetsAt,
    tone: percent >= 100 ? "error" : percent >= QUOTA_LOW_PERCENT ? "warn" : "primary",
  };
}

export type AgentState = "live" | "quota_low" | "quota_exhausted" | "inactive";

/** Subscription statuses under which the platform serves an organization's agent. */
const SERVICEABLE_STATUSES: readonly string[] = ["active", "trialing"];

/** Mirrors the database's `is_organization_serviceable` plus the token quota. */
export function deriveAgentState(input: {
  subscriptionStatus: string;
  quota: Pick<QuotaUsage, "percent">;
  /** Agency child tenants are served by their agency's subscription, not their own. */
  servedByAgency?: boolean;
}): AgentState {
  const serviceable =
    input.servedByAgency || SERVICEABLE_STATUSES.includes(input.subscriptionStatus);
  if (!serviceable) return "inactive";
  if (input.quota.percent >= 100) return "quota_exhausted";
  if (input.quota.percent >= QUOTA_LOW_PERCENT) return "quota_low";
  return "live";
}
