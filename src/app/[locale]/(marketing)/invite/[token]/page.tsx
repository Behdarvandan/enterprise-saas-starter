import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import AcceptInviteButton from "./AcceptInviteButton";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("auth.invite");

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

  const stateMessageKeys: Record<string, "notFound" | "accepted" | "revoked" | "expired"> = {
    "not-found": "notFound",
    accepted: "accepted",
    revoked: "revoked",
    expired: "expired",
  };

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20 sm:px-6">
      <Card className="p-8">
        {!user ? (
          <>
            <h1 className="text-xl font-bold text-ink-primary">{t("signInTitle")}</h1>
            <p className="mt-1 text-sm text-ink-muted">{t("signInSubtitle")}</p>
            <Link
              href={`/login?next=/invite/${token}`}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-violet px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet/90"
            >
              {t("signInButton")}
            </Link>
          </>
        ) : state === "valid" && invitation && organization ? (
          <>
            <h1 className="text-xl font-bold text-ink-primary">{t("invitedTitle")}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {t("joinAs", { name: organization.name, role: invitation.role })}
            </p>
            <p className="mt-2 text-xs text-ink-muted">
              {t("sentTo", { email: invitation.email })}
            </p>
            <div className="mt-6">
              <AcceptInviteButton token={token} />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-ink-primary">{t("unavailableTitle")}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {t(`states.${stateMessageKeys[state]}`)}
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-violet px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet/90"
            >
              {t("goToDashboard")}
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
