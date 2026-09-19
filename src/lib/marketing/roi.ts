/**
 * Landing-page ROI model. An illustrative estimate, not a measurement: every
 * assumption is a named constant that the calculator shows to the visitor.
 */

export interface RoiRange {
  min: number;
  max: number;
  step: number;
  initial: number;
}

/** Monthly inbound conversations / booking requests. */
export const VOLUME_RANGE: RoiRange = { min: 500, max: 10_000, step: 100, initial: 2_500 };
/** Current support / customer-service headcount. */
export const AGENT_RANGE: RoiRange = { min: 1, max: 20, step: 1, initial: 3 };

export interface RoiAssumptions {
  /** Human handling time per conversation, in minutes. */
  handleMinutesPerConversation: number;
  /** Share of conversations the agent resolves without a human (0-1). */
  automationRate: number;
  /** Fully loaded cost of one human support hour, in USD. */
  hourlyCostUsd: number;
  /** Paid hours per person per month. */
  paidHoursPerAgent: number;
  /** Typical human first-response time on live chat, in minutes. */
  humanFirstResponseMinutes: number;
  /** Agent first-response time, in seconds. */
  agentResponseSeconds: number;
}

export const DEFAULT_ASSUMPTIONS: RoiAssumptions = {
  handleMinutesPerConversation: 6,
  automationRate: 0.7,
  hourlyCostUsd: 14,
  paidHoursPerAgent: 160,
  humanFirstResponseMinutes: 15,
  agentResponseSeconds: 8,
};

/** A plan whose monthly bill is netted off the savings (USD, whole dollars). */
export interface RoiPlanCost {
  /** Conversations per month the plan covers. */
  conversations: number;
  monthlyCostUsd: number;
}

export interface RoiInput {
  monthlyVolume: number;
  agentCount: number;
}

export interface RoiResult {
  /** Human hours the agent takes off the team each month. */
  hoursSaved: number;
  /** Savings before the platform bill. */
  grossSavingsUsd: number;
  /** Platform bill netted off, or null when no listed plan covers the volume. */
  platformCostUsd: number | null;
  /** `grossSavingsUsd` minus the platform bill (equal to gross when it is null). */
  netSavingsUsd: number;
  /** First-response time reduction, 0-100. */
  responseTimeReductionPct: number;
}

function clamp(value: number, range: RoiRange): number {
  if (!Number.isFinite(value)) return range.initial;
  return Math.min(range.max, Math.max(range.min, value));
}

/**
 * Hours saved are capped at what the current team actually works: the model
 * never credits savings on hours nobody is paid for. When the volume exceeds
 * every listed plan, the platform bill is unknown (custom quote) and the
 * result is reported gross.
 */
export function computeRoi(
  input: RoiInput,
  plans: readonly RoiPlanCost[],
  assumptions: RoiAssumptions = DEFAULT_ASSUMPTIONS,
): RoiResult {
  const volume = clamp(input.monthlyVolume, VOLUME_RANGE);
  const agents = clamp(input.agentCount, AGENT_RANGE);

  const hoursNeeded = (volume * assumptions.handleMinutesPerConversation) / 60;
  const automatedHours = hoursNeeded * assumptions.automationRate;
  const teamCapacityHours = agents * assumptions.paidHoursPerAgent;
  const hoursSaved = Math.min(automatedHours, teamCapacityHours);

  const grossSavingsUsd = hoursSaved * assumptions.hourlyCostUsd;
  const covering = [...plans]
    .sort((a, b) => a.conversations - b.conversations)
    .find((plan) => plan.conversations >= volume);
  const platformCostUsd = covering?.monthlyCostUsd ?? null;

  const humanSeconds = assumptions.humanFirstResponseMinutes * 60;
  const responseTimeReductionPct = Math.max(
    0,
    (1 - assumptions.agentResponseSeconds / humanSeconds) * 100,
  );

  return {
    hoursSaved,
    grossSavingsUsd,
    platformCostUsd,
    netSavingsUsd: grossSavingsUsd - (platformCostUsd ?? 0),
    responseTimeReductionPct,
  };
}
