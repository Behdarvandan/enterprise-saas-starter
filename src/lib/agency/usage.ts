import type { OrgTokenUsagePoint } from "@/components/admin/TokenUsageChart";
import type { Database } from "@/types/database";

export type AgencyUsageRow =
  Database["public"]["Functions"]["get_agency_usage_summary"]["Returns"][number];

/** A tenant at or above this share of its allocation is flagged as "near limit". */
export const NEAR_LIMIT_PERCENT = 80;

const MAX_CHART_TENANTS = 12;

/**
 * Share (0-100) of a tenant's allocation that has been consumed. A tenant
 * with nothing allocated reads as 0 — there is no budget to be near the
 * limit of; the UI flags "no allocation" separately.
 */
export function consumptionPercent(row: Pick<AgencyUsageRow, "quota_granted" | "quota_allocation">): number {
  if (row.quota_granted <= 0) return 0;
  const consumed = Math.max(row.quota_granted - row.quota_allocation, 0);
  return Math.min(100, (consumed / row.quota_granted) * 100);
}

export interface UsageSummary {
  tenantCount: number;
  totalRequests: number;
  totalCompletions: number;
  tokensGranted: number;
  tokensConsumed: number;
  /** Consumed share of everything granted, 0-100. */
  consumptionPercent: number;
  lowConfidenceCount: number;
  /** Low-confidence share of completions, 0-100. */
  lowConfidenceRate: number;
  quotaExhaustedCount: number;
  tenantsNearLimit: number;
  /** Tenants that were granted tokens and have none left. */
  tenantsOutOfTokens: number;
}

export function summarizeUsage(rows: AgencyUsageRow[]): UsageSummary {
  let totalRequests = 0;
  let totalCompletions = 0;
  let tokensGranted = 0;
  let tokensConsumed = 0;
  let lowConfidenceCount = 0;
  let quotaExhaustedCount = 0;
  let tenantsNearLimit = 0;
  let tenantsOutOfTokens = 0;

  for (const row of rows) {
    totalRequests += row.rag_requests;
    totalCompletions += row.completions;
    lowConfidenceCount += row.low_confidence;
    quotaExhaustedCount += row.quota_exhausted;
    tokensGranted += row.quota_granted;
    tokensConsumed += Math.max(row.quota_granted - row.quota_allocation, 0);

    if (row.quota_granted > 0) {
      if (row.quota_allocation <= 0) tenantsOutOfTokens += 1;
      else if (consumptionPercent(row) >= NEAR_LIMIT_PERCENT) tenantsNearLimit += 1;
    }
  }

  return {
    tenantCount: rows.length,
    totalRequests,
    totalCompletions,
    tokensGranted,
    tokensConsumed,
    consumptionPercent: tokensGranted > 0 ? Math.min(100, (tokensConsumed / tokensGranted) * 100) : 0,
    lowConfidenceCount,
    lowConfidenceRate: totalCompletions > 0 ? (lowConfidenceCount / totalCompletions) * 100 : 0,
    quotaExhaustedCount,
    tenantsNearLimit,
    tenantsOutOfTokens,
  };
}

/** Chart points for tenants that have an allocation, most-consumed first. */
export function toTokenUsagePoints(rows: AgencyUsageRow[]): OrgTokenUsagePoint[] {
  return rows
    .filter((row) => row.quota_granted > 0)
    .map((row) => ({
      organization: row.tenant_name,
      percentUsed: consumptionPercent(row),
      tokensUsed: Math.max(row.quota_granted - row.quota_allocation, 0),
      tokensLimit: row.quota_granted,
    }))
    .sort((a, b) => b.percentUsed - a.percentUsed)
    .slice(0, MAX_CHART_TENANTS);
}

export interface PoolSummary {
  pool: number;
  allocated: number;
  unallocated: number;
  /** Allocated share of the pool, 0-100 (0 when the pool is empty). */
  percentAllocated: number;
}

export function summarizePool(pool: number, tenants: { quota_granted: number }[]): PoolSummary {
  const allocated = tenants.reduce((sum, tenant) => sum + tenant.quota_granted, 0);
  return {
    pool,
    allocated,
    unallocated: Math.max(pool - allocated, 0),
    percentAllocated: pool > 0 ? Math.min(100, (allocated / pool) * 100) : 0,
  };
}

/** Days windows the analytics page accepts (anything else falls back to the default). */
export const ANALYTICS_WINDOWS = [7, 30, 90] as const;
export const DEFAULT_ANALYTICS_WINDOW = 30;

export function parseAnalyticsWindow(raw: string | string[] | undefined): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return (ANALYTICS_WINDOWS as readonly number[]).includes(value) ? value : DEFAULT_ANALYTICS_WINDOW;
}
