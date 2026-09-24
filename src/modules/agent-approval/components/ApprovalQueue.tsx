"use client";

import { useCallback, useEffect, useState } from "react";
import { createCoreBrowserClient } from "@/core/db";
import { useTenant } from "@/core/tenant";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { fetchPendingApprovals, submitApprovalDecision } from "@/modules/agent-approval/service";
import type { AgentApprovalTask } from "@/modules/agent-approval/types";

async function getAccessToken(): Promise<string | undefined> {
  const supabase = createCoreBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

/**
 * Zero-prop slot contribution (same contract as DemoWidget/AuditLogTable) —
 * sources tenant/jwt itself. Also subscribes to Realtime `postgres_changes`
 * on `agent_approvals` to auto-refetch on live updates. That table doesn't
 * exist yet (approval data currently comes only from pasargad-core's REST
 * API — see service.ts), so this subscription is a forward-compatible
 * placeholder: it starts firing the moment that table lands.
 */
export default function ApprovalQueue() {
  const { tenant } = useTenant();
  const [tasks, setTasks] = useState<AgentApprovalTask[]>([]);

  const loadApprovals = useCallback(async () => {
    if (!tenant) return;
    try {
      const jwt = await getAccessToken();
      const pending = await fetchPendingApprovals(tenant.id, jwt);
      setTasks(pending);
    } catch (error) {
      console.error("[agent-approval] failed to load pending approvals:", error);
    }
  }, [tenant]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  useEffect(() => {
    if (!tenant) return;

    const supabase = createCoreBrowserClient();
    const channel = supabase
      .channel(`agent_approvals:${tenant.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_approvals", filter: `organization_id=eq.${tenant.id}` },
        () => {
          loadApprovals();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant, loadApprovals]);

  async function resolveTask(id: string, approved: boolean) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    try {
      const jwt = await getAccessToken();
      await submitApprovalDecision(id, approved, undefined, tenant?.id, jwt);
    } catch (error) {
      console.error("[agent-approval] failed to submit approval decision:", error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Approval Queue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-400">No pending agent approvals.</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div className="text-sm">
                <p className="font-medium">{task.actionName}</p>
                <p className="text-slate-400">{task.agentId}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => resolveTask(task.id, true)}>
                  Approve
                </Button>
                <Button size="sm" variant="secondary" onClick={() => resolveTask(task.id, false)}>
                  Reject
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
