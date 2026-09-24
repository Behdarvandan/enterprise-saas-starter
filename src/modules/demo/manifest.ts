import type { ModuleManifest } from "@/core/registry";
import DemoWidget from "@/modules/demo/components/DemoWidget";

export const demoManifest: ModuleManifest = {
  id: "demo",
  name: "Demo Module",
  version: "1.0.0",
  enabled: true,
  navigation: [{ title: "Demo", href: "/dashboard/demo", icon: "LayoutDashboard", roles: ["owner", "admin"] }],
  slots: [{ slotId: "dashboard-overview-slot", component: DemoWidget }],
};
