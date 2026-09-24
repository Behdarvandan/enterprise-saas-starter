"use client";

import { Clock, Timer, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";
import GlassPanel from "@/components/marketing/GlassPanel";
import { Button } from "@/core/ui/primitives/button";
import { Slider } from "@/core/ui/primitives/slider";
import { Link } from "@/i18n/navigation";
import { isRtlLocale } from "@/i18n/routing";
import { formatMetricNumber, formatMetricPercent } from "@/lib/format";
import {
  AGENT_RANGE,
  DEFAULT_ASSUMPTIONS,
  VOLUME_RANGE,
  computeRoi,
  type RoiPlanCost,
} from "@/lib/marketing/roi";

interface RoiCalculatorProps {
  /** USD plans whose bill is netted off the savings (from the real plan data). */
  plans: readonly RoiPlanCost[];
}

interface ResultCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  valueClassName: string;
  note: string;
}

function ResultCard({ icon, label, value, valueClassName, note }: ResultCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="flex items-center gap-2 text-xs font-medium text-slate-400">
        {icon}
        {label}
      </p>
      <p dir="ltr" className={`mt-2 text-start font-mono text-3xl font-semibold tabular-nums ${valueClassName}`}>
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-400">{note}</p>
    </div>
  );
}

/** Interactive savings estimate. Everything it shows follows from `computeRoi`'s stated assumptions. */
export default function RoiCalculator({ plans }: RoiCalculatorProps) {
  const t = useTranslations("marketing.landing.roi");
  const locale = useLocale();
  const [volume, setVolume] = useState(VOLUME_RANGE.initial);
  const [agents, setAgents] = useState(AGENT_RANGE.initial);

  const result = useMemo(
    () => computeRoi({ monthlyVolume: volume, agentCount: agents }, plans),
    [volume, agents, plans],
  );

  const number = (value: number) => formatMetricNumber(locale, value);
  const usd = (value: number) =>
    formatMetricNumber(locale, value, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";
  const assumptions = DEFAULT_ASSUMPTIONS;

  return (
    <GlassPanel className="p-5 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10">
        <div className="space-y-8">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-slate-200">
                {t("volumeLabel")}
              </span>
              <span dir="ltr" className="font-mono text-lg font-semibold tabular-nums text-violet-400">
                {number(volume)}
              </span>
            </div>
            <Slider
              dir={dir}
              className="mt-4"
              thumbLabel={t("volumeLabel")}
              min={VOLUME_RANGE.min}
              max={VOLUME_RANGE.max}
              step={VOLUME_RANGE.step}
              value={[volume]}
              onValueChange={([next]) => setVolume(next ?? VOLUME_RANGE.initial)}
            />
            <div dir="ltr" className="mt-2 flex justify-between font-mono text-[11px] text-slate-400">
              <span>{number(VOLUME_RANGE.min)}</span>
              <span>{number(VOLUME_RANGE.max)}</span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-slate-200">
                {t("agentsLabel")}
              </span>
              <span dir="ltr" className="font-mono text-lg font-semibold tabular-nums text-violet-400">
                {number(agents)}
              </span>
            </div>
            <Slider
              dir={dir}
              className="mt-4"
              thumbLabel={t("agentsLabel")}
              min={AGENT_RANGE.min}
              max={AGENT_RANGE.max}
              step={AGENT_RANGE.step}
              value={[agents]}
              onValueChange={([next]) => setAgents(next ?? AGENT_RANGE.initial)}
            />
            <div dir="ltr" className="mt-2 flex justify-between font-mono text-[11px] text-slate-400">
              <span>{number(AGENT_RANGE.min)}</span>
              <span>{number(AGENT_RANGE.max)}</span>
            </div>
          </div>

          <Button asChild variant="glow" size="lg" className="w-full sm:w-auto">
            <Link href="/signup">{t("cta")}</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ResultCard
            icon={<Clock aria-hidden className="size-3.5 text-violet-400" />}
            label={t("hoursLabel")}
            value={number(Math.round(result.hoursSaved))}
            valueClassName="text-violet-400"
            note={t("hoursNote", { rate: formatMetricPercent(locale, assumptions.automationRate * 100) })}
          />
          <ResultCard
            icon={<Timer aria-hidden className="size-3.5 text-violet-400" />}
            label={t("responseLabel")}
            value={formatMetricPercent(locale, result.responseTimeReductionPct)}
            valueClassName="text-violet-400"
            note={t("responseNote", {
              human: number(assumptions.humanFirstResponseMinutes),
              agent: number(assumptions.agentResponseSeconds),
            })}
          />
          <div className="sm:col-span-2">
            <ResultCard
              icon={<Wallet aria-hidden className="size-3.5 text-emerald-400" />}
              label={t("netLabel")}
              value={usd(result.netSavingsUsd)}
              valueClassName="text-emerald-400"
              note={
                result.platformCostUsd === null
                  ? t("netGrossNote")
                  : t("netWithPlanNote", { cost: usd(result.platformCostUsd) })
              }
            />
          </div>
        </div>
      </div>

      <details className="group mt-8 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
        <summary className="cursor-pointer list-none text-sm font-medium text-slate-300 focus-visible:ring-2 focus-visible:ring-ring/60">
          {t("assumptionsTitle")}
        </summary>
        <ul className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
          <li>{t("assumptions.handle", { minutes: number(assumptions.handleMinutesPerConversation) })}</li>
          <li>{t("assumptions.automation", { rate: formatMetricPercent(locale, assumptions.automationRate * 100) })}</li>
          <li>{t("assumptions.hourly", { cost: usd(assumptions.hourlyCostUsd) })}</li>
          <li>{t("assumptions.capacity", { hours: number(assumptions.paidHoursPerAgent) })}</li>
          <li>{t("assumptions.humanResponse", { minutes: number(assumptions.humanFirstResponseMinutes) })}</li>
          <li>{t("assumptions.agentResponse", { seconds: number(assumptions.agentResponseSeconds) })}</li>
        </ul>
        <p className="mt-3 text-xs font-medium text-amber-300">{t("disclaimer")}</p>
      </details>
    </GlassPanel>
  );
}
