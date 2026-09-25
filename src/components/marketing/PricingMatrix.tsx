"use client";

import { Check, Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import GlassPanel from "@/components/marketing/GlassPanel";
import Badge from "@/components/ui/Badge";
import { Button } from "@/core/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/ui/primitives/dialog";
import { Switch } from "@/core/ui/primitives/switch";
import { Link } from "@/i18n/navigation";
import { formatMetricNumber } from "@/lib/format";
import {
  isSkillIncluded,
  type PricingPlanView,
  type SkillRowView,
} from "@/lib/marketing/pricing-view";
import { PLAN_TIERS, type PlanLimits, type PlanTier } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface PricingMatrixProps {
  plans: PricingPlanView[];
  skills: SkillRowView[];
}

/** A locked cell the visitor clicked: which skill, and the plan that unlocks it. */
interface UpsellTarget {
  skill: SkillRowView;
  tier: PlanTier;
}

export default function PricingMatrix({ plans, skills }: PricingMatrixProps) {
  const t = useTranslations("marketing.landing.pricing");
  const tTier = useTranslations("common.tiers");
  const tSkill = useTranslations("dashboard.skills");
  const locale = useLocale();
  const [upsell, setUpsell] = useState<UpsellTarget | null>(null);

  const skillName = (skill: SkillRowView) =>
    skill.id === "custom" ? tSkill("enterprise.title") : tSkill(`catalog.${skill.id}.title`);
  const skillDescription = (skill: SkillRowView) =>
    skill.id === "custom" ? tSkill("enterprise.description") : tSkill(`catalog.${skill.id}.description`);

  function limitLines(limits: PlanLimits): string[] {
    const count = (value: number) => formatMetricNumber(locale, value);
    return [
      limits.conversations === null
        ? t("limits.conversationsUnlimited")
        : t("limits.conversations", { count: count(limits.conversations) }),
      limits.records === null
        ? t("limits.recordsUnlimited")
        : t("limits.records", { count: count(limits.records) }),
      limits.documents === null
        ? t("limits.documentsUnlimited")
        : t("limits.documents", { count: limits.documents, formatted: count(limits.documents) }),
    ];
  }

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <GlassPanel
            key={plan.tier}
            className={cn(
              "relative flex flex-col p-6",
              plan.highlight && "border-primary/50 shadow-[0_0_40px_rgba(100,116,139,0.18)]",
            )}
          >
            {plan.highlight ? (
              <Badge tone="violet" className="absolute -top-3 start-6 bg-popover">
                {t("popular")}
              </Badge>
            ) : null}
            <h3 className="text-lg font-semibold tracking-tight text-foreground">{tTier(plan.tier)}</h3>
            <p className="mt-1 min-h-10 text-sm text-muted-foreground">{t(`plans.${plan.tier}.description`)}</p>
            <p className="mt-5 flex items-baseline gap-1.5">
              {plan.priceLabel === null ? (
                <span className="text-3xl font-semibold tracking-tight text-foreground">{t("custom")}</span>
              ) : (
                <>
                  <span dir="ltr" className="font-mono text-4xl font-semibold tracking-tight text-foreground">
                    {plan.priceLabel}
                  </span>
                  <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
                </>
              )}
            </p>
            <ul className="mt-6 flex-1 space-y-2.5">
              {limitLines(plan.limits).map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  {line}
                </li>
              ))}
            </ul>
            <Button
              asChild
              variant={plan.highlight ? "glow" : "secondary"}
              size="lg"
              className="mt-8 w-full"
            >
              <Link href={plan.href}>{t(`plans.${plan.tier}.cta`)}</Link>
            </Button>
          </GlassPanel>
        ))}
      </div>

      <GlassPanel className="mt-8 p-4 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight text-foreground">{t("matrixTitle")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("matrixHint")}</p>

        <div role="table" aria-label={t("matrixTitle")} className="mt-5 text-sm">
          <div
            role="row"
            className="grid grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))] items-center gap-2 border-b border-border pb-3 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground sm:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] sm:text-xs sm:tracking-wider"
          >
            <span role="columnheader">{t("skillColumn")}</span>
            {PLAN_TIERS.map((tier) => (
              <span key={tier} role="columnheader" className="truncate text-center">
                {tTier(tier)}
              </span>
            ))}
          </div>

          {skills.map((skill) => (
            <div
              key={skill.id}
              role="row"
              className="grid grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))] items-center gap-2 border-b border-border/60 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]"
            >
              <div role="rowheader" className="min-w-0 pe-2">
                <p className="font-medium text-foreground">{skillName(skill)}</p>
                <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{skillDescription(skill)}</p>
              </div>
              {PLAN_TIERS.map((tier) => (
                <div key={tier} role="cell" className="flex justify-center">
                  {isSkillIncluded(tier, skill) ? (
                    // Read-only: reflects what the plan includes, not a setting.
                    <Switch
                      checked
                      disabled
                      aria-label={t("includedOn", { skill: skillName(skill), tier: tTier(tier) })}
                      className="disabled:opacity-100"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setUpsell({ skill, tier: skill.minTier })}
                      aria-label={t("lockedOn", { skill: skillName(skill), tier: tTier(tier) })}
                      className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-border bg-secondary/60 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      <Lock aria-hidden className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </GlassPanel>

      <Dialog open={upsell !== null} onOpenChange={(open) => !open && setUpsell(null)}>
        <DialogContent>
          {upsell ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t("upsell.title", { skill: skillName(upsell.skill), tier: tTier(upsell.tier) })}
                </DialogTitle>
                <DialogDescription>{skillDescription(upsell.skill)}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setUpsell(null)}>
                  {t("upsell.dismiss")}
                </Button>
                <Button asChild variant="glow">
                  <Link href={upsell.tier === "enterprise" ? "/solutions#quote" : "/pricing"}>
                    {t(upsell.tier === "enterprise" ? "upsell.talkToSales" : "upsell.viewPlan", {
                      tier: tTier(upsell.tier),
                    })}
                  </Link>
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
