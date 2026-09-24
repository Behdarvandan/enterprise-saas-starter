export const SHELL_SLOTS = {
  DASHBOARD_OVERVIEW: "dashboard-overview-slot",
  HEADER_ACTIONS: "header-actions-slot",
  SETTINGS_TAB: "settings-tab-slot",
} as const;

export type CoreSlotId = (typeof SHELL_SLOTS)[keyof typeof SHELL_SLOTS];
