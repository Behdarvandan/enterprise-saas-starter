import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import SignOutButton from "@/components/auth/SignOutButton";
import BillingPortalButton from "@/components/billing/BillingPortalButton";
import type { Organization } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  let organization: Organization | null = null;
  if (membership) {
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", membership.organization_id)
      .single();
    organization = data;
  }

  const planLabels: Record<string, string> = {
    [process.env.STRIPE_PRICE_PRO ?? ""]: "Pro",
    [process.env.STRIPE_PRICE_ENTERPRISE ?? ""]: "Enterprise",
  };
  const planLabel = organization?.plan_id
    ? (planLabels[organization.plan_id] ?? organization.plan_id)
    : "Free";

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

      <div className="grid grid-cols-1 gap-6">
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
            Subscription
          </h2>

          {organization ? (
            <div className="mt-4">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <div className="border-b border-slate-100 pb-2">
                  <dt className="text-xs font-medium text-slate-400">
                    Organization
                  </dt>
                  <dd className="text-sm font-medium text-slate-800">
                    {organization.name}
                  </dd>
                </div>
                <div className="border-b border-slate-100 pb-2">
                  <dt className="text-xs font-medium text-slate-400">Plan</dt>
                  <dd className="text-sm font-medium text-slate-800">
                    {planLabel}
                  </dd>
                </div>
                <div className="border-b border-slate-100 pb-2">
                  <dt className="text-xs font-medium text-slate-400">Status</dt>
                  <dd className="text-sm font-medium capitalize text-slate-800">
                    {organization.subscription_status}
                  </dd>
                </div>
                <div className="border-b border-slate-100 pb-2">
                  <dt className="text-xs font-medium text-slate-400">Renews</dt>
                  <dd className="text-sm font-medium text-slate-800">
                    {organization.current_period_end
                      ? new Date(
                          organization.current_period_end,
                        ).toLocaleDateString()
                      : "N/A"}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex items-center gap-3">
                {organization.stripe_customer_id ? (
                  <BillingPortalButton />
                ) : (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
                  >
                    Choose a plan
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              You don&apos;t belong to an organization yet.{" "}
              <Link
                href="/pricing"
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                Choose a plan
              </Link>{" "}
              to get started.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
