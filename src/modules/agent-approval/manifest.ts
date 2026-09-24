import type { ModuleManifest } from "@/core/registry";
import { SHELL_SLOTS } from "@/core/ui/slots";
import ApprovalQueue from "@/modules/agent-approval/components/ApprovalQueue";

export const AgentApprovalModuleManifest: ModuleManifest = {
  id: "agent-approval",
  name: "Agent Approval Queue",
  version: "1.0.0",
  enabled: true,
  slots: [{ slotId: SHELL_SLOTS.DASHBOARD_OVERVIEW, component: ApprovalQueue }],
};
