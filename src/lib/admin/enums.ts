/** Narrowing guards for the operator CRM's text-typed enum columns (see the leads migrations). */

export const LEAD_STATUSES = ["new", "contacted", "quoted", "accepted", "rejected"] as const;
export type KnownLeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_CATEGORIES = [
  "fullstack_saas",
  "ai_automation",
  "architecture_security",
  "payment_subscription",
] as const;
export type KnownLeadCategory = (typeof LEAD_CATEGORIES)[number];

export const WORKING_MODES = ["hourly", "project", "either"] as const;
export type KnownWorkingMode = (typeof WORKING_MODES)[number];

export const PROJECT_STAGES = ["design", "backend", "test", "live"] as const;
export type KnownProjectStage = (typeof PROJECT_STAGES)[number];

function guard<T extends string>(values: readonly T[]) {
  return (value: string | null | undefined): T | null =>
    value != null && (values as readonly string[]).includes(value) ? (value as T) : null;
}

export const asLeadStatus = guard(LEAD_STATUSES);
export const asLeadCategory = guard(LEAD_CATEGORIES);
export const asWorkingMode = guard(WORKING_MODES);
export const asProjectStage = guard(PROJECT_STAGES);
