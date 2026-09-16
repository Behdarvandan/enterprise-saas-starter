import { requireMembership } from "@/lib/auth";
import { canManageMembers } from "@/lib/team";
import { getOrganizationName } from "@/lib/organizations";
import { Card } from "@/components/ui/card";
import OrganizationForm from "./OrganizationForm";

export default async function OrganizationSettingsPage() {
  const { membership } = await requireMembership();

  const canManage = canManageMembers(membership.role);
  const organizationName = await getOrganizationName(membership.organizationId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-ink-primary">Organization</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Manage your organization settings.
      </p>

      <div className="mt-6">
        <Card className="p-6">
          {canManage ? (
            <OrganizationForm name={organizationName ?? ""} />
          ) : (
            <p className="text-sm text-ink-muted">
              Only owners and admins can edit organization settings.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
