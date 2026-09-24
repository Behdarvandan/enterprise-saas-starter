export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface AgentApprovalTask {
  id: string;
  tenantId: string;
  agentId: string;
  runId: string;
  actionName: string;
  payload: Record<string, unknown>;
  status: ApprovalStatus;
  createdAt: string;
}
