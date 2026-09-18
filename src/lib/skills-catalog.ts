/**
 * Display copy for Ops Crew skills (`crew_config.enabled_skills` ids), shared
 * by the tenant Skills page and the agency portal's per-tenant skills dialog.
 */
export const SKILL_LABELS: Record<string, { title: string; description: string }> = {
  rag_search: {
    title: "Knowledge base search (RAG)",
    description:
      "Let the assistant search your uploaded documents to ground its answers.",
  },
  calendar_booking: {
    title: "Calendar booking assistant",
    description:
      "Let the assistant check appointment availability for your services.",
  },
};

export function getSkillLabel(skill: string): { title: string; description: string } {
  return SKILL_LABELS[skill] ?? { title: skill, description: "" };
}
