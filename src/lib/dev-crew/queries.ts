import { createAdminClient } from "@/lib/supabase/admin";
import { readCrewMetadata } from "@/lib/dev-crew/recommendation";
import type { CrewInsight } from "@/types";

export const CREW_ACTION = "dev_crew.recommendation";
export const CREW_PAGE_SIZE = 20;

export interface CrewQuery {
  limit?: number;
  /** Only rows strictly older than this ISO timestamp (pagination). */
  before?: string;
  /** Only rows strictly newer than this ISO timestamp (live polling). */
  since?: string;
}

/**
 * Reads an organization's Dev Crew recommendations, newest first.
 *
 * Uses the service-role client because `audit_logs` has no member SELECT
 * policy (only operators and agency admins); tenant scoping is therefore
 * enforced here by the explicit `organization_id` filter, and callers must
 * pass the organization from `requireMembership*`, never from user input.
 */
export async function fetchCrewInsights(
  organizationId: string,
  { limit = CREW_PAGE_SIZE, before, since }: CrewQuery = {},
): Promise<CrewInsight[]> {
  let query = createAdminClient()
    .from("audit_logs")
    .select("id, created_at, metadata")
    .eq("organization_id", organizationId)
    .eq("action", CREW_ACTION)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) query = query.lt("created_at", before);
  if (since) query = query.gt("created_at", since);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load crew insights: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    ...readCrewMetadata(row.metadata),
  }));
}
