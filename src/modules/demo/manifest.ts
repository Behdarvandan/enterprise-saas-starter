import type { ModuleManifest } from "@/core/registry";
import { SHELL_SLOTS } from "@/core/ui/slots";
import DemoHeaderAction from "@/modules/demo/components/DemoHeaderAction";
import DemoWidget from "@/modules/demo/components/DemoWidget";

export const demoManifest: ModuleManifest = {
  id: "demo",
  name: "Demo Module",
  version: "1.0.0",
  enabled: true,
  navigation: [{ title: "Demo", href: "/dashboard/demo", icon: "LayoutDashboard", roles: ["owner", "admin"] }],
  slots: [
    { slotId: SHELL_SLOTS.DASHBOARD_OVERVIEW, component: DemoWidget },
    { slotId: SHELL_SLOTS.HEADER_ACTIONS, component: DemoHeaderAction },
  ],
};
