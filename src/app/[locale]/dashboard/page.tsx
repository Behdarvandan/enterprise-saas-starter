import { requireUser } from "@/lib/auth";
import { getUserMembership } from "@/lib/team";
import { Card } from "@/components/ui/card";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  const membership = await getUserMembership(user.id);

  let organization: { name: string } | null = null;
  let memberCount = 0;
  let serviceCount = 0;
  let documentCount = 0;

  if (membership) {
    const [{ data: org }, { count: members }, { count: services }, { count: documents }] =
      await Promise.all([
        supabase
          .from("organizations")
          .select("name")
          .eq("id", membership.organizationId)
          .single(),
        supabase
          .from("memberships")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", membership.organizationId),
        supabase
          .from("services")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", membership.organizationId),
        supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", membership.organizationId),
      ]);
    organization = org;
    memberCount = members ?? 0;
    serviceCount = services ?? 0;
    documentCount = documents ?? 0;
  }

  const checklistItems = [
    {
      id: "org",
      label: "Create your organization",
      href: "/dashboard/settings/organization",
      done: Boolean(organization),
    },
    {
      id: "team",
      label: "Invite a teammate",
      href: "/dashboard/team",
      done: memberCount > 1,
    },
    {
      id: "service",
      label: "Add a bookable service",
      href: "/dashboard/bookings",
      done: serviceCount > 0,
    },
    {
      id: "kb",
      label: "Ingest a knowledge base document",
      href: "/dashboard/chatbot",
      done: documentCount > 0,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-ink-primary">Overview</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Welcome back{user.email ? `, ${user.email}` : ""}.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6">
        <OnboardingChecklist userId={user.id} items={checklistItems} />

        <Card className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Authenticated user
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <div className="border-b border-subtle pb-2">
              <dt className="text-xs font-medium text-ink-muted">Email</dt>
              <dd className="text-sm font-medium text-ink-primary">{user.email}</dd>
            </div>
            <div className="border-b border-subtle pb-2">
              <dt className="text-xs font-medium text-ink-muted">User ID</dt>
              <dd className="font-mono text-sm text-ink-primary">{user.id}</dd>
            </div>
            <div className="border-b border-subtle pb-2">
              <dt className="text-xs font-medium text-ink-muted">Last sign in</dt>
              <dd className="text-sm font-medium text-ink-primary">
                {user.last_sign_in_at ?? "N/A"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Organization
          </h2>
          {organization && membership ? (
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <div className="border-b border-subtle pb-2">
                <dt className="text-xs font-medium text-ink-muted">Name</dt>
                <dd className="text-sm font-medium text-ink-primary">{organization.name}</dd>
              </div>
              <div className="border-b border-subtle pb-2">
                <dt className="text-xs font-medium text-ink-muted">Your role</dt>
                <dd className="text-sm font-medium capitalize text-ink-primary">
                  {membership.role}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">
              You don&apos;t belong to an organization yet.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
