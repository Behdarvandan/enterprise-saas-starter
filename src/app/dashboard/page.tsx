import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import SignOutButton from "@/components/auth/SignOutButton";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            You are authenticated with Supabase.
          </p>
        </div>
        <SignOutButton />
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Authenticated user
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <div className="border-b border-slate-100 pb-2">
            <dt className="text-xs font-medium text-slate-400">Email</dt>
            <dd className="text-sm font-medium text-slate-800">{user.email}</dd>
          </div>
          <div className="border-b border-slate-100 pb-2">
            <dt className="text-xs font-medium text-slate-400">User ID</dt>
            <dd className="text-sm font-medium text-slate-800">{user.id}</dd>
          </div>
          <div className="border-b border-slate-100 pb-2">
            <dt className="text-xs font-medium text-slate-400">Last sign in</dt>
            <dd className="text-sm font-medium text-slate-800">
              {user.last_sign_in_at ?? "N/A"}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
