import { Lightbulb } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import { LiquidCard } from "@/components/ui/liquid/LiquidCard";
import EmptyState from "@/components/ui/EmptyState";
import { Link } from "@/i18n/navigation";
import { deriveSeverity, parseRecommendation } from "@/lib/dev-crew/recommendation";
import type { CrewInsight, CrewSeverity } from "@/types";

const severityTone: Record<CrewSeverity, BadgeTone> = {
  critical: "error",
  warning: "warn",
  info: "neutral",
};

interface LatestCrewAlertProps {
  insight: CrewInsight | null;
}

/** Overview widget: the most recent Dev Crew recommendation, or an all-clear. */
export default async function LatestCrewAlert({ insight }: LatestCrewAlertProps) {
  const t = await getTranslations("dashboard.overview.crewWidget");
  const tSeverity = await getTranslations("dashboard.crewInsights.severity");
  const format = await getFormatter();
  const severity = insight ? deriveSeverity(insight.negativeCount) : null;
  const parsed = insight ? parseRecommendation(insight.recommendation) : null;

  return (
    <LiquidCard className="flex flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{t("title")}</h2>
        <Lightbulb aria-hidden className="size-4 text-muted-foreground" />
      </div>

      {insight && severity && parsed ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={severityTone[severity]}>{tSeverity(severity)}</Badge>
            <span className="text-xs text-muted-foreground">
              {t("signals", { count: insight.negativeCount })}
            </span>
            <span className="text-xs text-muted-foreground">
              {format.relativeTime(new Date(insight.createdAt), new Date())}
            </span>
          </div>
          <p className="line-clamp-4 text-sm text-foreground">{parsed.advice ?? parsed.raw}</p>
        </div>
      ) : (
        <EmptyState icon={Lightbulb} title={t("emptyTitle")} description={t("emptyDescription")} />
      )}

      <Link
        href="/dashboard/crew-insights"
        className="mt-4 text-sm font-medium text-primary transition-colors hover:text-primary"
      >
        {t("viewAll")}
      </Link>
    </LiquidCard>
  );
}
