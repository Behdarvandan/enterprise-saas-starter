import { createPasargadClient } from "@/core/api/client";
import type { AgentApprovalTask, ApprovalStatus } from "@/modules/agent-approval/types";

interface RawApprovalTask {
  id: string;
  tenant_id: string;
  agent_id: string;
  run_id: string;
  action_name: string;
  payload?: Record<string, unknown>;
  status: ApprovalStatus;
  created_at: string;
}

function toAgentApprovalTask(raw: RawApprovalTask): AgentApprovalTask {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    agentId: raw.agent_id,
    runId: raw.run_id,
    actionName: raw.action_name,
    payload: raw.payload ?? {},
    status: raw.status,
    createdAt: raw.created_at,
  };
}

export async function fetchPendingApprovals(tenantId: string, jwt?: string): Promise<AgentApprovalTask[]> {
  const client = createPasargadClient({ jwt, tenantId });
  const { data, error } = await client.GET("/api/v1/agent/approvals");

  if (error) {
    throw new Error("[agent-approval] failed to fetch pending approvals");
  }

  return (data ?? []).map(toAgentApprovalTask).filter((task) => task.status === "pending");
}

export async function submitApprovalDecision(
  taskId: string,
  approved: boolean,
  reason?: string,
  tenantId?: string,
  jwt?: string,
): Promise<void> {
  const client = createPasargadClient({ jwt, tenantId });
  const { error } = await client.POST("/api/v1/agent/approvals/{task_id}/decision", {
    params: { path: { task_id: taskId } },
    body: { approved, reason },
  });

  if (error) {
    throw new Error("[agent-approval] failed to submit approval decision");
  }
}
