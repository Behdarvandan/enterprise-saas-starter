import { createCoreServerClient } from "@/core/db";

export type UsageMetric = "api_calls" | "tokens";

export interface TenantUsageRecord {
  id: string;
  tenantId: string;
  periodStart: string;
  apiCallsCount: number;
  tokenUsageCount: number;
  updatedAt: string;
}

interface TenantUsageRow {
  id: string;
  organization_id: string;
  period_start: string;
  api_calls_count: number;
  token_usage_count: number;
  updated_at: string;
}

function toTenantUsageRecord(row: TenantUsageRow): TenantUsageRecord {
  return {
    id: row.id,
    tenantId: row.organization_id,
    periodStart: row.period_start,
    apiCallsCount: row.api_calls_count,
    tokenUsageCount: row.token_usage_count,
    updatedAt: row.updated_at,
  };
}

export async function incrementUsage(tenantId: string, metric: UsageMetric, count = 1): Promise<void> {
  const supabase = await createCoreServerClient();
  const { error } = await supabase.rpc("increment_tenant_usage", {
    p_organization_id: tenantId,
    p_metric: metric,
    p_count: count,
  });

  if (error) {
    throw new Error("[billing] failed to increment tenant usage");
  }
}

export async function getTenantUsage(tenantId: string): Promise<TenantUsageRecord | null> {
  const supabase = await createCoreServerClient();
  const { data, error } = await supabase
    .from("tenant_usage")
    .select()
    .eq("organization_id", tenantId)
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("[billing] failed to fetch tenant usage");
  }

  return data ? toTenantUsageRecord(data as unknown as TenantUsageRow) : null;
}
