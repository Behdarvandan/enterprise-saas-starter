import { MailX } from "lucide-react";
import { requireMembership } from "@/lib/auth";
import { canManageMembers } from "@/lib/team";
import { getOrganizationName } from "@/lib/organizations";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import EmptyState from "@/components/ui/EmptyState";
import InviteMemberForm from "./InviteMemberForm";
import MemberRow from "./MemberRow";
import RevokeInvitationButton from "./RevokeInvitationButton";

export default async function TeamPage() {
  const { supabase, user, membership } = await requireMembership();
  const organizationId = membership.organizationId;
  const canManage = canManageMembers(membership.role);

  const organizationName = await getOrganizationName(organizationId);

  const { data: members } = await supabase
    .from("memberships")
    .select("*")
    .eq("organization_id", organizationId);

  const userIds = (members ?? []).map((member) => member.user_id);
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const { data: invitations } = await supabase
    .from("invitations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-primary">Team</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {organizationName ?? "Your organization"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Members ({members?.length ?? 0})
          </h2>
          <ul className="mt-4 divide-y divide-subtle">
            {(members ?? []).map((member) => {
              const profile = profileMap.get(member.user_id);
              return (
                <MemberRow
                  key={member.id}
                  membershipId={member.id}
                  email={profile?.email ?? "Unknown"}
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
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Invite member
          </h2>
          {canManage ? (
            <InviteMemberForm />
          ) : (
            <p className="mt-4 text-sm text-ink-muted">
              Only owners and admins can invite new members.
            </p>
          )}
        </Card>

        <Card>
          <div className="p-6 pb-0">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Pending invitations ({invitations?.length ?? 0})
            </h2>
          </div>
          {invitations && invitations.length > 0 ? (
            <ul className="mt-4 divide-y divide-subtle px-6 pb-6">
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-primary">
                      {invitation.email}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {invitation.role} · expires{" "}
                      {formatDate(invitation.expires_at)}
                    </p>
                  </div>
                  {canManage && (
                    <RevokeInvitationButton invitationId={invitation.id} />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={MailX}
              title="No pending invitations"
              description="Invitations you send will show up here until they're accepted or revoked."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
