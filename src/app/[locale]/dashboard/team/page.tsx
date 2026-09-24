import { MailX } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Card } from "@/core/ui/primitives/card";
import EmptyState from "@/components/ui/EmptyState";
import { requireMembership } from "@/lib/auth";
import { getOrganizationName } from "@/lib/organizations";
import { canManageMembers } from "@/lib/team";
import InviteMemberForm from "./InviteMemberForm";
import MemberRow from "./MemberRow";
import RevokeInvitationButton from "./RevokeInvitationButton";

export default async function TeamPage() {
  const { supabase, user, membership } = await requireMembership();
  const organizationId = membership.organizationId;
  const canManage = canManageMembers(membership.role);
  const [t, tRoles, format] = await Promise.all([
    getTranslations("dashboard.team"),
    getTranslations("shell.roles"),
    getFormatter(),
  ]);

  const organizationName = await getOrganizationName(organizationId);

  const { data: members } = await supabase
    .from("memberships")
    .select("*")
    .eq("organization_id", organizationId);

  const userIds = (members ?? []).map((member) => member.user_id);
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, email, full_name").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const { data: invitations } = await supabase
    .from("invitations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title={t("title")} description={organizationName ?? t("yourOrganization")} />

      <Card className="p-6">
        <h2 className="text-sm font-semibold tracking-tight text-slate-100">
          {t("members", { count: members?.length ?? 0 })}
        </h2>
        <ul className="mt-4 divide-y divide-slate-800">
          {(members ?? []).map((member) => {
            const profile = profileMap.get(member.user_id);
            return (
              <MemberRow
                key={member.id}
                membershipId={member.id}
                email={profile?.email ?? t("unknownMember")}
                name={profile?.full_name ?? null}
                role={member.role}
                isCurrentUser={member.user_id === user.id}
                canManage={canManage}
              />
            );
          })}
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold tracking-tight text-slate-100">{t("invite.title")}</h2>
        {canManage ? (
          <InviteMemberForm />
        ) : (
          <p className="mt-4 text-sm text-slate-400">{t("invite.onlyAdmins")}</p>
        )}
      </Card>

      <Card>
        <div className="p-6 pb-0">
          <h2 className="text-sm font-semibold tracking-tight text-slate-100">
            {t("pending.title", { count: invitations?.length ?? 0 })}
          </h2>
        </div>
        {invitations && invitations.length > 0 ? (
          <ul className="mt-4 divide-y divide-slate-800 px-6 pb-6">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-100">{invitation.email}</p>
                  <p className="text-xs text-slate-400">
                    {t("pending.expires", {
                      role: tRoles(invitation.role),
                      date: format.dateTime(new Date(invitation.expires_at), { dateStyle: "medium" }),
                    })}
                  </p>
                </div>
                {canManage ? <RevokeInvitationButton invitationId={invitation.id} /> : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={MailX} title={t("pending.emptyTitle")} description={t("pending.emptyDescription")} />
        )}
      </Card>
    </PageContainer>
  );
}
