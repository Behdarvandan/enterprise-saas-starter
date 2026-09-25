import * as Sentry from "@sentry/nextjs";
import { requireOperatorAdmin } from "@/lib/operator";
import { LanguageSwitcher } from "@/components/ui/liquid/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/liquid/ThemeToggle";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AppShell from "@/core/ui/shell/AppShell";
import UserMenu from "@/components/layout/UserMenu";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // requireOperatorAdmin() redirects to /login (signed out) or /dashboard
  // (signed in but not owner/admin of the operator organization) — see
  // src/lib/operator.ts.
  const { user } = await requireOperatorAdmin();

  // Tags every error/transaction reported from within this portal so
  // Sentry issues can be filtered/triaged by which portal they came from.
  Sentry.setTag("portal", "admin");

  return (
    <AppShell
      sidebar={<AdminSidebar />}
      headerEnd={
        <>
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu email={user.email ?? ""} />
        </>
      }
    >
      {children}
    </AppShell>
  );
}
