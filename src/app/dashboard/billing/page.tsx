import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserMembership } from "@/lib/team";
import Card from "@/components/ui/Card";
import BillingPortalButton from "@/components/billing/BillingPortalButton";
import type { Organization } from "@/types";

export default async function BillingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const membership = await getUserMembership(user.id);

  let organization: Organization | null = null;
  if (membership) {
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", membership.organizationId)
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-ink-primary">Billing</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Manage your subscription and payment details.
      </p>

      <div className="mt-6">
        {organization ? (
          <Card className="p-6">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <div className="border-b border-subtle pb-2">
                <dt className="text-xs font-medium text-ink-muted">Plan</dt>
                <dd className="text-sm font-medium text-ink-primary">
                  {planLabel}
                </dd>
              </div>
              <div className="border-b border-subtle pb-2">
                <dt className="text-xs font-medium text-ink-muted">Status</dt>
                <dd className="text-sm font-medium capitalize text-ink-primary">
                  {organization.subscription_status}
                </dd>
              </div>
              <div className="border-b border-subtle pb-2">
                <dt className="text-xs font-medium text-ink-muted">Renews</dt>
                <dd className="text-sm font-medium text-ink-primary">
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
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet/90"
                >
                  Choose a plan
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <p className="text-sm text-ink-muted">
              You don&apos;t belong to an organization yet.{" "}
              <Link
                href="/pricing"
                className="font-semibold text-violet-dim hover:text-violet"
              >
                Choose a plan
              </Link>{" "}
              to get started.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
