import { FileText, KeyRound, Workflow } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent } from "@/core/ui/primitives/card";
import { Link } from "@/i18n/navigation";

/** Mirrors the real active subset from /app/agents' ASSISTANTS array, kept consistent across pages. */
const ACTIVE_AGENTS = [
  { name: "Support triage", model: "gemini-2.5-flash" },
  { name: "Onboarding guide", model: "gemini-2.5-flash" },
  { name: "Booking assistant", model: "gemini-2.5-pro" },
  { name: "Knowledge base search", model: "gemini-2.5-flash" },
];

/** Active Workflows / 24h Execution Volume are fully illustrative — no multi-workflow or execution-log backend exists anywhere in the codebase. */
const KPIS = {
  activeAgents: 4,
  totalDocuments: 8,
  activeWorkflows: 3,
  executionVolume: "1,842",
};

type ActivityKind = "ragIngest" | "workflowRun" | "systemEvent";

interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  detail: string;
  timeAgo: string;
}

/** Mock-only: no real activity-log backend exists (the real audit_logs table is a different domain, established when building /app/logs). */
const ACTIVITY: ActivityEntry[] = [
  { id: "1", kind: "ragIngest", detail: "Refund policy.pdf", timeAgo: "2m ago" },
  { id: "2", kind: "workflowRun", detail: "Customer Support Auto-Triage", timeAgo: "14m ago" },
  { id: "3", kind: "systemEvent", detail: "API key rotated", timeAgo: "38m ago" },
  { id: "4", kind: "ragIngest", detail: "Employee handbook.docx", timeAgo: "1h ago" },
  { id: "5", kind: "workflowRun", detail: "Customer Support Auto-Triage", timeAgo: "2h ago" },
  { id: "6", kind: "systemEvent", detail: "Domain verification pending", timeAgo: "5h ago" },
];

const ACTIVITY_ICON: Record<ActivityKind, typeof FileText> = {
  ragIngest: FileText,
  workflowRun: Workflow,
  systemEvent: KeyRound,
};

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="glass">
      <CardContent className="flex flex-col gap-1 p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function AgentStatusDot() {
  return (
    <span
      aria-hidden
      data-active
      className="size-2 shrink-0 rounded-full bg-primary-hover data-[active]:animate-status-pulse"
    />
  );
}

export default async function AppOverviewPage() {
  const t = await getTranslations("dashboard.appOverview");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
            <Badge>{t("statusOperational")}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button asChild>
          <Link href="/app/agents">{t("newAgentButton")}</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("kpis.activeAgents")} value={String(KPIS.activeAgents)} />
        <KpiCard label={t("kpis.totalDocuments")} value={String(KPIS.totalDocuments)} />
        <KpiCard label={t("kpis.activeWorkflows")} value={String(KPIS.activeWorkflows)} />
        <KpiCard label={t("kpis.executionVolume")} value={KPIS.executionVolume} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
        <Card variant="glass">
          <CardContent className="flex flex-col gap-3 p-5">
            <h2 className="text-sm font-semibold text-foreground">{t("agentsOverview.title")}</h2>
            <div className="flex flex-col gap-2">
              {ACTIVE_AGENTS.map((agent) => (
                <Link key={agent.name} href="/app/agents">
                  <Card
                    variant="item"
                    className="flex flex-row items-center justify-between gap-2 px-4 py-3"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <AgentStatusDot />
                      {agent.name}
                    </span>
                    <Badge variant="outline">{agent.model}</Badge>
                  </Card>
                </Link>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="self-start" asChild>
              <Link href="/app/agents">{t("agentsOverview.viewAll")}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="flex flex-col gap-3 p-5">
            <h2 className="text-sm font-semibold text-foreground">{t("activityFeed.title")}</h2>
            <ul className="flex flex-col gap-3">
              {ACTIVITY.map((entry) => {
                const Icon = ACTIVITY_ICON[entry.kind];
                return (
                  <li key={entry.id} className="flex items-start gap-3">
                    <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-1 flex-col">
                      <p className="text-sm text-foreground">{t(`activityFeed.${entry.kind}`, { name: entry.detail, message: entry.detail })}</p>
                      <time className="text-xs text-muted-foreground">{entry.timeAgo}</time>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
