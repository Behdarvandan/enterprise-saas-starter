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
 * design system's own --chart-1 token (the same primary hue used for
 * buttons/links throughout the app) rather than a one-off color.
 */
export default function FreelanceRevenueChart({ data }: FreelanceRevenueChartProps) {
  const t = useTranslations("ui.charts");
  const locale = useLocale();
  const money = (value: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0, numberingSystem: "latn" }).format(value);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="month"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) =>
            value >= 1000 ? `${money(value / 1000)}k` : money(value)
          }
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
          formatter={(value) => [money(Number(value ?? 0)), t("revenue")]}
        />
        <Bar dataKey="amount" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
