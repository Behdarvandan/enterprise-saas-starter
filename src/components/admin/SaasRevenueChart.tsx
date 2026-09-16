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

export interface PlanRevenuePoint {
  plan: string;
  amount: number;
  organizations: number;
}

interface SaasRevenueChartProps {
  data: PlanRevenuePoint[];
}

/**
 * A live current-state breakdown, not a historical trend: this codebase
 * doesn't keep a local ledger of past Stripe/PayTR invoices (only the
 * current subscription snapshot on `organizations`), so a monthly time
 * series would have to be fabricated. This instead sums *live* MRR by plan
 * across active/trialing organizations, computed at request time — a
 * single categorical series, using --chart-2 (the same green as the
 * "success"/"paid" status color) since it reads as "money already coming
 * in," distinct from chart-1's freelance-invoice violet.
 */
export default function SaasRevenueChart({ data }: SaasRevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-subtle)" />
        <XAxis
          dataKey="plan"
          tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-subtle)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) => `$${value}`}
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
            const organizations = (item.payload as unknown as PlanRevenuePoint)
              .organizations;
            return [
              `$${Number(value ?? 0).toLocaleString()}/mo · ${organizations} org(s)`,
              "MRR",
            ];
          }}
        />
        <Bar dataKey="amount" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
