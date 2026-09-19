"use client";

import { useLocale, useTranslations } from "next-intl";
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
  const t = useTranslations("ui.charts");
  const locale = useLocale();
  const money = (value: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0, numberingSystem: "latn" }).format(value);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="plan"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) => money(value)}
        />
        <Tooltip
          cursor={{ fill: "var(--color-popover)" }}
          contentStyle={{
            backgroundColor: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--color-foreground)",
          }}
          formatter={(value, _name, item) => {
            const organizations = (item.payload as unknown as PlanRevenuePoint)
              .organizations;
            return [
              t("mrrValue", { amount: money(Number(value ?? 0)), count: organizations }),
              t("mrr"),
            ];
          }}
        />
        <Bar dataKey="amount" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
