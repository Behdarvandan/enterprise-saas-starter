"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface OrgTokenUsagePoint {
  organization: string;
  percentUsed: number;
  tokensUsed: number;
  tokensLimit: number;
}

interface TokenUsageChartProps {
  data: OrgTokenUsagePoint[];
}

/**
 * A live current-period snapshot by organization, not a genuine multi-month
 * time series: `usage_quotas` keeps one row per org (reset by the rollover
 * cron), with no historical ledger of past periods to plot — the same
 * honesty tradeoff already made for SaasRevenueChart in Faz 4. This shows
 * each organization's percentage of its current quota consumed, single
 * series, amber (--chart-3, the same hue as the "warn" status color) since
 * it reads as a consumption/quota gauge rather than a revenue figure.
 */
export default function TokenUsageChart({ data }: TokenUsageChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-subtle)" />
        <XAxis
          dataKey="organization"
          tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-subtle)" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) => `${value}%`}
        />
        <Tooltip
          cursor={{ fill: "var(--color-surface-raised)" }}
          contentStyle={{
            backgroundColor: "var(--color-surface-raised)",
            border: "1px solid var(--color-subtle)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--color-ink-primary)",
          }}
          formatter={(value, _name, item) => {
            const point = item.payload as unknown as OrgTokenUsagePoint;
            return [
              `${Number(value ?? 0).toFixed(1)}% (${point.tokensUsed.toLocaleString()} / ${point.tokensLimit.toLocaleString()} tokens)`,
              "Quota used",
            ];
          }}
        />
        <Bar dataKey="percentUsed" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
