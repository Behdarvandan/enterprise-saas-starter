import { getTranslations } from "next-intl/server";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Card } from "@/core/ui/primitives/card";
import { requireMembership } from "@/lib/auth";
import { getOrganizationName } from "@/lib/organizations";
import { canManageMembers } from "@/lib/team";
import OrganizationForm from "./OrganizationForm";

export default async function OrganizationSettingsPage() {
  const { membership } = await requireMembership();
  const t = await getTranslations("dashboard.settings.organization");

  const canManage = canManageMembers(membership.role);
  const organizationName = await getOrganizationName(membership.organizationId);

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title={t("label")} description={t("description")} />
      <Card className="p-6">
        {canManage ? (
          <OrganizationForm name={organizationName ?? ""} />
        ) : (
          <p className="text-sm text-muted-foreground">{t("onlyAdmins")}</p>
        )}
      </Card>
    </PageContainer>
  );
}
