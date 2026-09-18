import { Lightbulb } from "lucide-react";
import { requireMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import EmptyState from "@/components/ui/EmptyState";

const RECOMMENDATION_LIMIT = 20;

interface DevCrewRecommendation {
  id: string;
  created_at: string;
  metadata: { recommendation?: string; negative_count?: number } | null;
}

export default async function CrewInsightsPage() {
  const { membership } = await requireMembership();

  // audit_logs has no client-readable RLS policy (operator-facing only, see
  // supabase/migrations/20261114000005_audit_logs.sql) so this reads via the
  // admin client, gated by requireMembership() above and an explicit
  // organization_id filter in the query itself — same pattern as
  // dashboard/skills/page.tsx's tenant_configs read.
  const admin = createAdminClient();
  const { data } = await admin
    .from("audit_logs")
    .select("id, created_at, metadata")
    .eq("organization_id", membership.organizationId)
    .eq("action", "dev_crew.recommendation")
    .order("created_at", { ascending: false })
    .limit(RECOMMENDATION_LIMIT);

  const recommendations = (data ?? []) as DevCrewRecommendation[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-ink-primary">Dev Crew Insights</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Automated recommendations from scanning recent chat activity for
        low-confidence or unhappy outcomes.
      </p>

      <div className="mt-6 space-y-3">
        {recommendations.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title="No insights yet"
            description="Dev Crew scans chat activity after every conversation and will post a recommendation here if it spots a pattern worth reviewing."
          />
        ) : (
          recommendations.map((entry) => (
            <Card key={entry.id} className="animate-reveal-up p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-ink-primary">
                  {entry.metadata?.recommendation ?? "No details available."}
                </p>
                {typeof entry.metadata?.negative_count === "number" && (
                  <span className="shrink-0 rounded-full bg-status-warn/10 px-2 py-0.5 text-xs font-semibold text-status-warn">
                    {entry.metadata.negative_count} signal
                    {entry.metadata.negative_count === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                {new Date(entry.created_at).toLocaleString()}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
