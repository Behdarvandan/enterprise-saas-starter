import { Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import SkillMatrix, { type SkillRow } from "@/components/dashboard/skills/SkillMatrix";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { requireMembership } from "@/lib/auth";
import { getOrganizationSnapshot } from "@/lib/dashboard/queries";
import { getAllPlans, resolvePlanTier, tierIncludes } from "@/lib/plans";
import { getActiveTenantConfig } from "@/lib/skills/queries";
import { readEnabledSkills, readRagSearchValues } from "@/lib/skills/tenant-config";
import { DEFAULT_ENABLED_SKILLS, SKILL_CATALOG } from "@/lib/skills-catalog";
import { canManageMembers } from "@/lib/team";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const { membership } = await requireMembership();
  const t = await getTranslations("dashboard.skills");

  const [snapshot, config] = await Promise.all([
    getOrganizationSnapshot(membership.organizationId),
    getActiveTenantConfig(membership.organizationId),
  ]);

  const tier = resolvePlanTier(snapshot?.planId);
  const stored = readEnabledSkills(config) ?? DEFAULT_ENABLED_SKILLS;
  const ragValues: Record<string, number> = readRagSearchValues(config);

  const rows: SkillRow[] = SKILL_CATALOG.map((skill) => {
    const unlocked = tierIncludes(tier, skill.minTier);
    return {
      id: skill.id,
      minTier: skill.minTier,
      configurable: skill.configurable,
      unlocked,
      // A stored grant beyond the plan (e.g. after a downgrade) never shows as on.
      enabled: unlocked && stored.includes(skill.id),
      settings: skill.id === "rag_search" ? ragValues : {},
    };
  });

  const canManage = canManageMembers(membership.role);

  // Enterprise is contact-only in every region; its plan carries the sales link.
  const enterpriseCheckout = getAllPlans().find((plan) => plan.tier === "enterprise")?.checkout;
  const salesHref = enterpriseCheckout?.kind === "contact" ? enterpriseCheckout.href : "/services#quote";

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<Badge tone="violet">{t("currentPlan", { plan: t(`tiers.${tier}`) })}</Badge>}
      />

      {canManage ? null : (
        <p role="note" className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-slate-300">
          {t("readOnly")}
        </p>
      )}

      <SkillMatrix skills={rows} canManage={canManage} />

      {tier === "enterprise" ? null : (
        <Card className="flex flex-wrap items-center gap-4 border-amber-500/20 p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <Building2 aria-hidden className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-slate-100">{t("enterprise.title")}</h2>
            <p className="mt-1 text-sm text-slate-400">{t("enterprise.description")}</p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href={salesHref}>{t("enterprise.cta")}</Link>
          </Button>
        </Card>
      )}
    </PageContainer>
  );
}
