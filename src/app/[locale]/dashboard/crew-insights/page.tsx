import { getTranslations } from "next-intl/server";
import CrewFeed from "@/components/dashboard/crew/CrewFeed";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { requireMembership } from "@/lib/auth";
import { CREW_PAGE_SIZE, fetchCrewInsights } from "@/lib/dev-crew/queries";

export const dynamic = "force-dynamic";

export default async function CrewInsightsPage() {
  const { membership } = await requireMembership();
  const t = await getTranslations("dashboard.crewInsights");

  // One look-ahead row tells the feed whether an older page exists.
  const rows = await fetchCrewInsights(membership.organizationId, { limit: CREW_PAGE_SIZE + 1 });

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />
      <CrewFeed
        initial={rows.slice(0, CREW_PAGE_SIZE)}
        initialHasMore={rows.length > CREW_PAGE_SIZE}
        serverTime={new Date().toISOString()}
      />
    </PageContainer>
  );
}
