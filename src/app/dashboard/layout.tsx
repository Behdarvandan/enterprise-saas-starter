import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserOrganizations } from "@/lib/team";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import Topbar from "@/components/dashboard/Topbar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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
