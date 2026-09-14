import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Card from "@/components/ui/Card";
import AcceptInviteButton from "./AcceptInviteButton";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: invitation } = await admin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  let state: "not-found" | "accepted" | "revoked" | "expired" | "valid" =
    "not-found";
  if (invitation) {
    if (invitation.status === "accepted") state = "accepted";
    else if (invitation.status === "revoked") state = "revoked";
    else if (new Date(invitation.expires_at) < new Date()) state = "expired";
    else state = "valid";
  }

  const { data: organization } = invitation
    ? await admin
        .from("organizations")
        .select("name")
        .eq("id", invitation.organization_id)
        .single()
    : { data: null };

  const stateMessages: Record<string, string> = {
    "not-found": "This invitation link is invalid or has been removed.",
    accepted: "This invitation has already been accepted.",
    revoked: "This invitation has been revoked.",
    expired: "This invitation has expired.",
  };

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20 sm:px-6">
      <Card className="p-8">
        {!user ? (
          <>
            <h1 className="text-xl font-bold text-ink-primary">
              Sign in to accept
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              You need to sign in before accepting this invitation.
            </p>
            <Link
              href={`/login?next=/invite/${token}`}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-violet px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet/90"
            >
              Sign in
            </Link>
          </>
        ) : state === "valid" && invitation && organization ? (
          <>
            <h1 className="text-xl font-bold text-ink-primary">
              You&apos;re invited
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Join{" "}
              <span className="font-semibold text-ink-primary">
                {organization.name}
              </span>{" "}
              as{" "}
              <span className="font-semibold capitalize text-ink-primary">
                {invitation.role}
              </span>
              .
            </p>
            <p className="mt-2 text-xs text-ink-muted">
              This invitation was sent to {invitation.email}.
            </p>
            <div className="mt-6">
              <AcceptInviteButton token={token} />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-ink-primary">
              Invitation unavailable
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {stateMessages[state]}
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-violet px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet/90"
            >
              Go to dashboard
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
