import * as Sentry from "@sentry/nextjs";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireMembership } from "@/lib/auth";
import ClientTopbar from "@/components/client/ClientTopbar";

export default async function ClientLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // `requireMembership()` redirects to `/login` via plain next/navigation if
  // signed out (no locale prefix) — an existing, accepted tradeoff already
  // used at the page level elsewhere in this codebase (e.g.
  // dashboard/chatbot/page.tsx), now applied at the layout level here.
  // Membership itself is only needed to gate access; pages under /client
  // resolve it again themselves, matching the dashboard layout's pattern.
  const { supabase, user } = await requireMembership();

  // Operator staff (owner/admin of the operator organization) belong in the
  // admin CRM, not the client portal — is_operator_admin() is evaluated
  // against the fixed operator organization from platform_settings, not
  // this user's own membership, so this check is independent of `role`.
  const { data: isOperatorAdmin } = await supabase.rpc("is_operator_admin");
  if (isOperatorAdmin) {
    redirect({ href: "/admin", locale: locale as Locale });
  }

  // Tags every error/transaction reported from within this portal so
  // Sentry issues can be filtered/triaged by which portal they came from.
  Sentry.setTag("portal", "client");

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <ClientTopbar userEmail={user.email ?? ""} />
      <main id="main" className="flex-1">{children}</main>
    </div>
  );
}
