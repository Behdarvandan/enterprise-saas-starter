import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManageMembers, getUserMembership } from "@/lib/team";
import Card from "@/components/ui/Card";
import OrganizationForm from "./OrganizationForm";

export default async function OrganizationSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const membership = await getUserMembership(user.id);
  if (!membership) redirect("/dashboard");

  const canManage = canManageMembers(membership.role);

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", membership.organizationId)
    .single();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Organization</h1>
      <p className="mt-1 text-sm text-slate-500">
        Manage your organization settings.
      </p>

      <div className="mt-6">
        <Card className="p-6">
          {canManage ? (
            <OrganizationForm name={organization?.name ?? ""} />
          ) : (
            <p className="text-sm text-slate-500">
              Only owners and admins can edit organization settings.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
