import * as Sentry from "@sentry/nextjs";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";
import AgencySidebar from "@/components/layout/AgencySidebar";
import AppShell from "@/components/layout/AppShell";
import UserMenu from "@/components/layout/UserMenu";
import { getAdministeredAgency } from "@/lib/agency/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AgencyLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  // See dashboard/layout.tsx: this segment has no generateStaticParams, so
  // the param stays `string` and is cast for next-intl's redirect below.
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Locale-aware redirects (the shared `requireUser()` helper would drop the
  // locale prefix). The `return null`s never run — redirect() throws — but
  // narrow the types below. Each page still runs its own `requireAgencyAdmin()`:
  // layouts don't re-render on client-side navigation, so this guard alone
  // isn't enough.
  if (!user) {
    redirect({ href: "/login", locale: locale as Locale });
    return null;
  }

  const agency = await getAdministeredAgency(supabase);
  if (!agency) {
    redirect({ href: "/dashboard", locale: locale as Locale });
    return null;
  }

  Sentry.setTag("portal", "agency");

  return (
    <AppShell
      sidebar={<AgencySidebar agencyName={agency.name} />}
      headerEnd={
        <>
          <LocaleSwitcher />
          <UserMenu email={user.email ?? ""} />
        </>
      }
    >
      {children}
    </AppShell>
  );
}
