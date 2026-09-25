"use client";

import { useState } from "react";
import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent } from "@/core/ui/primitives/card";
import type { AgentApprovalTask, ApprovalStatus } from "@/modules/agent-approval";

interface ApprovalGateCardCopy {
  actionLabel: string;
  payloadLabel: string;
  approveButton: string;
  rejectButton: string;
  statusApproved: string;
  statusRejected: string;
}

/**
 * Reuses the real `AgentApprovalTask`/`ApprovalStatus` types from the agent-approval module
 * (per the module boundary rule) so this mock stays type-compatible with a future drop-in swap.
 * Manages its own local state rather than the live `ApprovalQueue` component, which requires a
 * tenant/Supabase-auth context this route doesn't have.
 */
export default function ApprovalGateCard({
  title,
  task,
  copy,
}: {
  title: string;
  task: AgentApprovalTask;
  copy: ApprovalGateCardCopy;
}) {
  const [status, setStatus] = useState<ApprovalStatus>(task.status);

  return (
    <Card variant="glass" className="mb-4 flex-1">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {status !== "pending" ? (
            <Badge variant={status === "approved" ? "default" : "destructive"}>
              {status === "approved" ? copy.statusApproved : copy.statusRejected}
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            {copy.payloadLabel} — {copy.actionLabel}: {task.actionName}
          </span>
          <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            {JSON.stringify(task.payload, null, 2)}
          </pre>
        </div>

        {status === "pending" ? (
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={() => setStatus("approved")}>
              {copy.approveButton}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setStatus("rejected")}>
              {copy.rejectButton}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
