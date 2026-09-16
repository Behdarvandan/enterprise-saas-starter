import * as Sentry from "@sentry/nextjs";
import { requireOperatorAdmin } from "@/lib/operator";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // requireOperatorAdmin() redirects to /login (signed out) or /dashboard
  // (signed in but not owner/admin of the operator organization) — see
  // src/lib/operator.ts. This is that guard's first real call site.
  const { user } = await requireOperatorAdmin();

  // Tags every error/transaction reported from within this portal so
  // Sentry issues can be filtered/triaged by which portal they came from.
  Sentry.setTag("portal", "admin");

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <AdminTopbar userEmail={user.email ?? ""} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
