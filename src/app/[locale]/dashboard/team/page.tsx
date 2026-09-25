import { getTranslations } from "next-intl/server";
import { Badge } from "@/core/ui/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { requireMembership } from "@/lib/auth";
import { canManageMembers } from "@/lib/team";
import type { MembershipRole } from "@/types";
import InviteMemberDialog from "./InviteMemberDialog";
import PendingInvitationsTable, { type PendingInvitation } from "./PendingInvitationsTable";
import TeamMembersTable, { type TeamMember } from "./TeamMembersTable";

interface InvitationRow {
  id: string;
  email: string;
  role: MembershipRole;
  expires_at: string;
}

export default async function DashboardTeamPage() {
  const { supabase, user, membership } = await requireMembership();
  const canManage = canManageMembers(membership.role);
  const t = await getTranslations("dashboard.team");

  const [{ data: membershipRows }, { data: invitationRows }] = await Promise.all([
    supabase
      .from("memberships")
      .select("id, role, user_id, profiles(email, full_name)")
      .eq("organization_id", membership.organizationId)
      .order("created_at", { ascending: true }),
    canManage
      ? supabase
          .from("invitations")
          .select("id, email, role, expires_at")
          .eq("organization_id", membership.organizationId)
          .eq("status", "pending")
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as InvitationRow[] | null }),
  ]);

  const members: TeamMember[] = (membershipRows ?? []).map((row) => ({
    membershipId: row.id,
    userId: row.user_id,
    role: row.role,
    email: row.profiles?.email ?? null,
    fullName: row.profiles?.full_name ?? null,
  }));

  const invitations: PendingInvitation[] = (invitationRows ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    expiresAt: new Date(row.expires_at).toLocaleDateString(),
  }));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
          <Badge variant="outline">{t("members", { count: members.length })}</Badge>
        </div>
        {canManage ? (
          <InviteMemberDialog
            copy={{
              trigger: t("invite.title"),
              title: t("invite.title"),
              emailLabel: t("invite.emailLabel"),
              emailPlaceholder: t("invite.emailPlaceholder"),
              roleLabel: t("invite.roleLabel"),
              send: t("invite.send"),
              sending: t("invite.sending"),
              sent: t("invite.sent"),
              roles: { admin: t("roles.admin"), member: t("roles.member") },
            }}
          />
        ) : null}
      </div>

      <Card variant="section">
        <CardHeader>
          <CardTitle>{t("yourOrganization")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamMembersTable
            members={members}
            viewerUserId={user.id}
            canManage={canManage}
            copy={{
              columns: {
                member: t("columns.member"),
                role: t("columns.role"),
                actions: t("columns.actions"),
              },
              unknownMember: t("unknownMember"),
              you: t("you"),
              remove: t("remove"),
              removeAria: (name) => t("removeAria", { name }),
              roleAria: (name) => t("roleAria", { name }),
              roles: {
                owner: t("roles.owner"),
                admin: t("roles.admin"),
                member: t("roles.member"),
              },
            }}
          />
        </CardContent>
      </Card>

      {canManage ? (
        <PendingInvitationsTable
          invitations={invitations}
          copy={{
            title: t("pending.title", { count: invitations.length }),
            emptyTitle: t("pending.emptyTitle"),
            emptyDescription: t("pending.emptyDescription"),
            columnEmail: t("pending.columnEmail"),
            columnRole: t("pending.columnRole"),
            expires: (role, date) => t("pending.expires", { role, date }),
            revoke: t("pending.revoke"),
          }}
        />
      ) : null}
    </div>
  );
}
