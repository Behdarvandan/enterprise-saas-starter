import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManageMembers, getUserMembership } from "@/lib/team";
import Card from "@/components/ui/Card";
import InviteMemberForm from "./InviteMemberForm";
import MemberRow from "./MemberRow";
import RevokeInvitationButton from "./RevokeInvitationButton";

export default async function TeamPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const membership = await getUserMembership(user.id);
  if (!membership) redirect("/dashboard");

  const organizationId = membership.organizationId;
  const canManage = canManageMembers(membership.role);

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .single();

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
        <h1 className="text-2xl font-bold text-slate-900">Team</h1>
        <p className="mt-1 text-sm text-slate-500">
          {organization?.name ?? "Your organization"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Members ({members?.length ?? 0})
          </h2>
          <ul className="mt-4 divide-y divide-slate-100">
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
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Invite member
          </h2>
          {canManage ? (
            <InviteMemberForm />
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Only owners and admins can invite new members.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Pending invitations ({invitations?.length ?? 0})
          </h2>
          {invitations && invitations.length > 0 ? (
            <ul className="mt-4 divide-y divide-slate-100">
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {invitation.email}
                    </p>
                    <p className="text-xs text-slate-500">
                      {invitation.role} · expires{" "}
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  {canManage && (
                    <RevokeInvitationButton invitationId={invitation.id} />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No pending invitations.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
