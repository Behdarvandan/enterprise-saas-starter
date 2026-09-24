export interface UsageMetricSummary {
  metric: string;
  used: number;
  limit: number;
  unit?: string;
}

export interface BillingPlanInfo {
  planId: string;
  planName: string;
  renewsAt?: string;
}
