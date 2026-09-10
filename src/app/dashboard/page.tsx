import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserMembership } from "@/lib/team";
import Card from "@/components/ui/Card";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getUserMembership(user.id);

  let organization: { name: string } | null = null;
  if (membership) {
    const { data } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", membership.organizationId)
      .single();
    organization = data;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
      <p className="mt-1 text-sm text-slate-500">
        Welcome back{user.email ? `, ${user.email}` : ""}.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6">
        <Card className="p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Authenticated user
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <div className="border-b border-slate-100 pb-2">
              <dt className="text-xs font-medium text-slate-400">Email</dt>
              <dd className="text-sm font-medium text-slate-800">
                {user.email}
              </dd>
            </div>
            <div className="border-b border-slate-100 pb-2">
              <dt className="text-xs font-medium text-slate-400">User ID</dt>
              <dd className="text-sm font-medium text-slate-800">{user.id}</dd>
            </div>
            <div className="border-b border-slate-100 pb-2">
              <dt className="text-xs font-medium text-slate-400">
                Last sign in
              </dt>
              <dd className="text-sm font-medium text-slate-800">
                {user.last_sign_in_at ?? "N/A"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Organization
          </h2>
          {organization && membership ? (
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <div className="border-b border-slate-100 pb-2">
                <dt className="text-xs font-medium text-slate-400">Name</dt>
                <dd className="text-sm font-medium text-slate-800">
                  {organization.name}
                </dd>
              </div>
              <div className="border-b border-slate-100 pb-2">
                <dt className="text-xs font-medium text-slate-400">
                  Your role
                </dt>
                <dd className="text-sm font-medium capitalize text-slate-800">
                  {membership.role}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              You don&apos;t belong to an organization yet.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
