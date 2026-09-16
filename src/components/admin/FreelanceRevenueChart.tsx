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

export interface MonthlyRevenuePoint {
  month: string;
  amount: number;
}

interface FreelanceRevenueChartProps {
  data: MonthlyRevenuePoint[];
}

/**
 * Single-series monthly trend, so per the dataviz skill's rule a legend box
 * is unnecessary — the card title already names the series. Uses the
 * design system's own --chart-1 token (the same violet used for buttons/
 * links throughout the app) rather than a one-off color.
 */
export default function FreelanceRevenueChart({ data }: FreelanceRevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-subtle)" />
        <XAxis
          dataKey="month"
          tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-subtle)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) =>
            value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value}`
          }
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
          formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, "Revenue"]}
        />
        <Bar dataKey="amount" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
