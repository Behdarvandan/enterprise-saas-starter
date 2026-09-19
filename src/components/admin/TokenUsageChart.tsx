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
 * series, the primary chart hue.
 */
export default function TokenUsageChart({ data }: TokenUsageChartProps) {
  const t = useTranslations("ui.charts");
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale, { numberingSystem: "latn" });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="organization"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) => `${value}%`}
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
            const point = item.payload as unknown as OrgTokenUsagePoint;
            return [
              t("quotaValue", {
                percent: Number(value ?? 0).toFixed(1),
                used: number.format(point.tokensUsed),
                limit: number.format(point.tokensLimit),
              }),
              t("quotaUsed"),
            ];
          }}
        />
        <Bar dataKey="percentUsed" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
