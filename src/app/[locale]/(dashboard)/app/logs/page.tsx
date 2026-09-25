import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/core/ui/primitives/card";
import type { ApprovalStatus } from "@/modules/agent-approval";
import type { ExecutionTraceSpan } from "./ExecutionTraceWaterfall";
import LogsTable from "./LogsTable";

export type MockLogLevel = "info" | "warn" | "error";

export interface MockLogEntry {
  id: string;
  timestamp: string;
  service: string;
  level: MockLogLevel;
  message: string;
  durationMs: number;
  /** Maps to ARCHITECTURE.md §10.C: audit logs must record the user authorization ID behind a high-privilege action. Null for entries with no gated action. */
  authorizationId: string | null;
  approvalStatus: ApprovalStatus | null;
}

const LOGS: MockLogEntry[] = [
  { id: "1", timestamp: "2026-09-25T08:12:03Z", service: "api-gateway", level: "info", message: "Request completed", durationMs: 142, authorizationId: null, approvalStatus: null },
  { id: "2", timestamp: "2026-09-25T08:12:45Z", service: "rag-worker", level: "info", message: "Chunk embedding batch processed", durationMs: 891, authorizationId: null, approvalStatus: null },
  { id: "3", timestamp: "2026-09-25T08:13:10Z", service: "billing-webhook", level: "warn", message: "Retrying webhook delivery (attempt 2)", durationMs: 2104, authorizationId: "auth_7f21", approvalStatus: "pending" },
  { id: "4", timestamp: "2026-09-25T08:14:02Z", service: "api-gateway", level: "error", message: "Upstream timeout calling assistant service", durationMs: 5032, authorizationId: null, approvalStatus: null },
  { id: "5", timestamp: "2026-09-25T08:14:37Z", service: "auth-service", level: "info", message: "Session refreshed", durationMs: 58, authorizationId: null, approvalStatus: null },
  { id: "6", timestamp: "2026-09-25T08:15:19Z", service: "rag-worker", level: "warn", message: "Document exceeded recommended chunk size", durationMs: 412, authorizationId: null, approvalStatus: null },
  { id: "7", timestamp: "2026-09-25T08:16:04Z", service: "workflow-engine", level: "info", message: "Workflow step completed: classify intent", durationMs: 233, authorizationId: "auth_5c3a", approvalStatus: "approved" },
  { id: "8", timestamp: "2026-09-25T08:16:48Z", service: "billing-webhook", level: "error", message: "Webhook delivery failed after 3 attempts", durationMs: 6210, authorizationId: "auth_1d90", approvalStatus: "rejected" },
  { id: "9", timestamp: "2026-09-25T08:17:20Z", service: "api-gateway", level: "info", message: "Request completed", durationMs: 98, authorizationId: null, approvalStatus: null },
  { id: "10", timestamp: "2026-09-25T08:18:02Z", service: "auth-service", level: "warn", message: "Rate limit threshold approaching", durationMs: 61, authorizationId: null, approvalStatus: null },
];

/** Execution trace waterfalls for the RAG-worker entries, keyed by log id. */
const EXECUTION_TRACES: Record<string, ExecutionTraceSpan[]> = {
  "2": [
    { id: "2-1", name: "embeddingGeneration", startOffsetMs: 0, durationMs: 210, detail: "gemini-embedding-001 · 32 chunks" },
    { id: "2-2", name: "vectorSearch", startOffsetMs: 210, durationMs: 140, detail: "pgvector HNSW · top 8 matches" },
    { id: "2-3", name: "llmTokenStream", startOffsetMs: 350, durationMs: 541, detail: "Claude 3.5 · 612 tokens streamed" },
  ],
  "6": [
    { id: "6-1", name: "embeddingGeneration", startOffsetMs: 0, durationMs: 96, detail: "gemini-embedding-001 · 4 chunks" },
    { id: "6-2", name: "vectorSearch", startOffsetMs: 96, durationMs: 88, detail: "pgvector HNSW · top 8 matches" },
    { id: "6-3", name: "llmTokenStream", startOffsetMs: 184, durationMs: 228, detail: "Llama 3.3 · 204 tokens streamed" },
  ],
};

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="glass">
      <CardContent className="flex flex-col gap-1 p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function LogsPage() {
  const t = await getTranslations("dashboard.logs");

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label={t("metrics.totalRequests")} value="48.2K" />
        <MetricCard label={t("metrics.avgLatency")} value="184 ms" />
        <MetricCard label={t("metrics.errorRate")} value="0.8%" />
        <MetricCard label={t("metrics.activeTokens")} value="312" />
      </div>

      <section className="px-6 pb-6">
        <LogsTable
          logs={LOGS}
          traces={EXECUTION_TRACES}
          copy={{
            searchPlaceholder: t("searchPlaceholder"),
            levels: {
              all: t("levels.all"),
              info: t("levels.info"),
              warn: t("levels.warn"),
              error: t("levels.error"),
            },
            columns: {
              timestamp: t("columns.timestamp"),
              service: t("columns.service"),
              level: t("columns.level"),
              message: t("columns.message"),
              duration: t("columns.duration"),
              authorization: t("columns.authorization"),
              trace: t("columns.trace"),
            },
            hitl: {
              filterLabel: t("hitl.filterLabel"),
              statusPending: t("hitl.statusPending"),
              statusApproved: t("hitl.statusApproved"),
              statusRejected: t("hitl.statusRejected"),
              none: t("hitl.none"),
            },
            trace: {
              dialogTitle: t("trace.dialogTitle"),
              totalDurationLabel: t("trace.totalDurationLabel"),
              spanLabels: {
                embeddingGeneration: t("trace.span.embeddingGeneration"),
                vectorSearch: t("trace.span.vectorSearch"),
                llmTokenStream: t("trace.span.llmTokenStream"),
              },
              viewButtonLabel: t("trace.viewButtonLabel"),
              expandLabel: t("trace.expandLabel"),
              collapseLabel: t("trace.collapseLabel"),
            },
          }}
        />
      </section>
    </div>
  );
}
