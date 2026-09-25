"use client";

import { Calendar, Database, Lock, Settings2, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { updateEnabledSkills } from "@/app/[locale]/dashboard/skills/actions";
import SkillConfigDialog from "@/components/dashboard/skills/SkillConfigDialog";
import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import { Card } from "@/core/ui/primitives/card";
import { Switch } from "@/core/ui/primitives/switch";
import { Link } from "@/i18n/navigation";
import type { PlanTier } from "@/lib/plans";
import type { SkillId } from "@/lib/skills-catalog";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export interface SkillRow {
  id: SkillId;
  minTier: PlanTier;
  configurable: boolean;
  /** The organization's plan includes this skill. */
  unlocked: boolean;
  enabled: boolean;
  /** Current settings for configurable skills. */
  settings: Record<string, number>;
}

interface SkillMatrixProps {
  skills: SkillRow[];
  /** Owners/admins may change skills; members get a read-only view. */
  canManage: boolean;
}

const skillIcon: Record<SkillId, LucideIcon> = {
  rag_search: Database,
  calendar_booking: Calendar,
};

const tierVariant: Record<PlanTier, "outline" | "default" | "secondary"> = {
  starter: "outline",
  pro: "default",
  enterprise: "secondary",
};

/**
 * The skill/capability control matrix. Toggles save immediately: the switch
 * flips optimistically, and a failed save rolls it back with a toast, so there
 * is never a "did I press Save?" state. Locked rows show the tier that
 * unlocks them and link to billing.
 */
export default function SkillMatrix({ skills, canManage }: SkillMatrixProps) {
  const t = useTranslations("dashboard.skills");
  const [enabled, setEnabled] = useState(
    () => new Set(skills.filter((skill) => skill.enabled).map((skill) => skill.id)),
  );
  const [pending, startTransition] = useTransition();
  const [configuring, setConfiguring] = useState<SkillId | null>(null);

  function toggle(skillId: SkillId, next: boolean) {
    const previous = enabled;
    const optimistic = new Set(previous);
    if (next) optimistic.add(skillId);
    else optimistic.delete(skillId);
    setEnabled(optimistic);

    startTransition(async () => {
      const result = await updateEnabledSkills([...optimistic]);
      if (result.error) {
        setEnabled(previous);
        toast({ tone: "error", title: t("updateFailed"), description: result.error });
        return;
      }
      toast({ tone: "success", title: t("updated") });
    });
  }

  const configuringRow = skills.find((skill) => skill.id === configuring);

  return (
    <>
      <ul aria-label={t("matrixLabel")} className="grid gap-3">
        {skills.map((skill) => {
          const Icon = skillIcon[skill.id];
          const title = t(`catalog.${skill.id}.title`);
          const tierName = t(`tiers.${skill.minTier}`);
          const isOn = enabled.has(skill.id);

          return (
            <li key={skill.id}>
              <Card
                className={cn("flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap", !skill.unlocked && "opacity-90")}
              >
                <div
                  aria-hidden
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    skill.unlocked ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {skill.unlocked ? <Icon className="size-5" /> : <Lock className="size-5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    <Badge variant={tierVariant[skill.minTier]}>{tierName}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`catalog.${skill.id}.description`)}</p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {skill.unlocked ? (
                    <>
                      {skill.configurable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canManage || !isOn}
                          onClick={() => setConfiguring(skill.id)}
                        >
                          <Settings2 aria-hidden />
                          {t("configure")}
                        </Button>
                      ) : null}
                      <Switch
                        checked={isOn}
                        disabled={!canManage || pending}
                        onCheckedChange={(next) => toggle(skill.id, next)}
                        aria-label={t("toggle", { skill: title })}
                      />
                    </>
                  ) : (
                    <>
                      <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
                        <Lock aria-hidden className="size-3.5" />
                        {t("requires", { tier: tierName })}
                      </span>
                      <Switch checked={false} disabled aria-label={t("toggle", { skill: title })} />
                      <Button asChild size="sm">
                        <Link href="/dashboard/billing">{t("upgrade", { tier: tierName })}</Link>
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {configuringRow ? (
        <SkillConfigDialog
          skillId={configuringRow.id}
          values={configuringRow.settings}
          open
          onOpenChange={(open) => {
            if (!open) setConfiguring(null);
          }}
        />
      ) : null}
    </>
  );
}
