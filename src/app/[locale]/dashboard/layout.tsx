import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getUserOrganizations } from "@/lib/team";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import Topbar from "@/components/dashboard/Topbar";

export default async function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  // Next's typed-routes validator requires this to stay `string` here since
  // this segment has no generateStaticParams of its own; the middleware
  // guarantees only "en"/"tr" ever reach it, hence the cast below.
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Deliberately not using the shared `requireUser()` helper from
  // `@/lib/auth`: that one redirects via plain `next/navigation`, which
  // would drop the "tr" locale prefix. This layout needs next-intl's
  // locale-aware redirect instead.
  //
  // next-intl's server-side redirect requires an explicit locale. The
  // `return null` never executes (redirect() always throws) but satisfies
  // TS narrowing of `user` below, since this shared navigation module isn't
  // typed as returning `never` outside a react-server-only context.
  if (!user) {
    redirect({ href: "/login", locale: locale as Locale });
    return null;
  }

  const organizations = await getUserOrganizations(user.id);
  const activeOrganizationId = organizations[0]?.organizationId ?? "";

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <DashboardSidebar
        organizations={organizations}
        activeOrganizationId={activeOrganizationId}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar userEmail={user.email ?? ""} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
