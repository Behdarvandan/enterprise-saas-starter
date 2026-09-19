import { getTranslations } from "next-intl/server";
import KnowledgeBasePanel from "@/components/dashboard/KnowledgeBasePanel";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { requireMembership } from "@/lib/auth";
import { getOrganizationSnapshot } from "@/lib/dashboard/queries";
import { KNOWLEDGE_BASE_DOCUMENT_LIMITS, resolvePlanTier } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function KnowledgeBasePage() {
  const { membership } = await requireMembership();
  const t = await getTranslations("dashboard.knowledgeBase");
  const snapshot = await getOrganizationSnapshot(membership.organizationId);

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />
      <KnowledgeBasePanel documentLimit={KNOWLEDGE_BASE_DOCUMENT_LIMITS[resolvePlanTier(snapshot?.planId)]} />
    </PageContainer>
  );
}
