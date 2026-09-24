"use client";

import { useState } from "react";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import type { AgentApprovalTask } from "@/modules/agent-approval/types";

/**
 * Zero-prop slot contribution (same contract as DemoWidget/AuditLogTable),
 * so it starts empty — real task data lands via a future data-fetching step.
 */
export default function ApprovalQueue() {
  const [tasks, setTasks] = useState<AgentApprovalTask[]>([]);

  function resolveTask(id: string) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
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
                <Button size="sm" onClick={() => resolveTask(task.id)}>
                  Approve
                </Button>
                <Button size="sm" variant="secondary" onClick={() => resolveTask(task.id)}>
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
