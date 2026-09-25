import { getTranslations } from "next-intl/server";
import { Bot, CheckCircle2, Clock, Database, GitBranch, Play, Plus, ShieldAlert, Webhook, type LucideIcon } from "lucide-react";
import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent } from "@/core/ui/primitives/card";
import type { AgentApprovalTask } from "@/modules/agent-approval";
import ApprovalGateCard from "./ApprovalGateCard";

type NodeType = "trigger" | "aiAgent" | "ragRetriever" | "conditional" | "webhook" | "approvalGate";
type StepStatus = "completed" | "pending" | "awaitingApproval";

/** Static step-by-step visualization — no @xyflow/react dependency exists yet, so this is not a real drag-and-drop node graph. */
interface MockWorkflowStep {
  id: string;
  title: string;
  nodeType: NodeType;
  status: StepStatus;
  /** Present only for `approvalGate` steps — the HITL execution gate blocking a high-privilege action. */
  approvalTask?: AgentApprovalTask;
}

const STEPS: MockWorkflowStep[] = [
  { id: "1", title: "New ticket received", nodeType: "trigger", status: "completed" },
  { id: "2", title: "Classify intent", nodeType: "aiAgent", status: "completed" },
  { id: "3", title: "Retrieve KB articles", nodeType: "ragRetriever", status: "completed" },
  { id: "4", title: "Check confidence threshold", nodeType: "conditional", status: "pending" },
  {
    id: "4b",
    title: "Issue $50 goodwill credit (high-privilege action)",
    nodeType: "approvalGate",
    status: "awaitingApproval",
    approvalTask: {
      id: "approval-1",
      tenantId: "tenant-1",
      agentId: "2",
      runId: "run-482",
      actionName: "issue_goodwill_credit",
      payload: { amount: 50, currency: "USD", customerId: "cust_9182" },
      status: "pending",
      createdAt: "2026-09-25T08:14:02Z",
    },
  },
  { id: "5", title: "Notify #support on Slack", nodeType: "webhook", status: "pending" },
];

const NODE_ICON: Record<NodeType, LucideIcon> = {
  trigger: Play,
  aiAgent: Bot,
  ragRetriever: Database,
  conditional: GitBranch,
  webhook: Webhook,
  approvalGate: ShieldAlert,
};

const PALETTE_NODE_TYPES = ["aiAgent", "ragRetriever", "conditional", "webhook", "approvalGate"] as const;

export default async function WorkflowsStudioPage() {
  const t = await getTranslations("dashboard.workflows");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">Customer Support Auto-Triage</h1>
          <Badge variant="secondary">{t("status.active")}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Plus aria-hidden size={16} />
            {t("actions.addNode")}
          </Button>
          <Button variant="default" size="sm">
            <Play aria-hidden size={16} />
            {t("actions.runTest")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">{t("palette.title")}</p>
          {PALETTE_NODE_TYPES.map((nodeType) => {
            const Icon = NODE_ICON[nodeType];
            return (
              <Card key={nodeType} variant="item">
                <CardContent className="flex items-center gap-3 p-3">
                  <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{t(`palette.${nodeType}`)}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col">
          <p className="pb-3 text-sm font-medium text-foreground">{t("canvas.title")}</p>
          {STEPS.map((step, index) => {
            const Icon = NODE_ICON[step.nodeType];
            const isLast = index === STEPS.length - 1;
            return (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                    <Icon aria-hidden size={14} className="text-muted-foreground" />
                  </div>
                  {!isLast ? <div className="w-px flex-1 bg-border" /> : null}
                </div>
                {step.nodeType === "approvalGate" && step.approvalTask ? (
                  <ApprovalGateCard
                    title={step.title}
                    task={step.approvalTask}
                    copy={{
                      actionLabel: t("hitl.actionLabel"),
                      payloadLabel: t("hitl.payloadLabel"),
                      approveButton: t("hitl.approveButton"),
                      rejectButton: t("hitl.rejectButton"),
                      statusApproved: t("hitl.statusApproved"),
                      statusRejected: t("hitl.statusRejected"),
                    }}
                  />
                ) : (
                  <Card variant="glass" className="mb-4 flex-1">
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <span className="text-sm font-medium text-foreground">{step.title}</span>
                      {step.status === "completed" ? (
                        <Badge variant="secondary">
                          <CheckCircle2 aria-hidden />
                          {t("status.completed")}
                        </Badge>
                      ) : step.status === "awaitingApproval" ? (
                        <Badge variant="outline">
                          <ShieldAlert aria-hidden />
                          {t("status.awaitingApproval")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock aria-hidden />
                          {t("status.pending")}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
