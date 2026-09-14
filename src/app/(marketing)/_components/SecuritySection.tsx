const CONTROLS = [
  {
    label: "Isolation model",
    detail: "Row Level Security on every tenant table, scoped via is_org_member(organization_id). No cross-tenant query path exists at the database layer.",
  },
  {
    label: "Privileged operations",
    detail: "Org creation and invitation acceptance run as SECURITY DEFINER functions with an explicit search_path, so elevated writes happen only through audited, narrow entry points.",
  },
  {
    label: "Service-role boundary",
    detail: "The Supabase service-role key is used only in server-only contexts — Stripe/PayTR webhook handlers and the anonymous customer booking API — never shipped to the client.",
  },
  {
    label: "Payment verification",
    detail: "Stripe and PayTR webhooks verify request signatures before writing subscription or payment state; unverified requests are rejected before touching the database.",
  },
  {
    label: "Deployment surface",
    detail: "Runs as a non-root user in a multi-stage Docker build on Next.js standalone output, deployed to AWS ECS Fargate behind a load balancer with a dedicated health-check endpoint.",
  },
];

export default function SecuritySection() {
  return (
    <section id="security" className="border-y border-subtle bg-surface">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-ink-primary sm:text-3xl">
          For the reviewer who reads the schema before the sales deck.
        </h2>
        <dl className="mt-10 space-y-6">
          {CONTROLS.map((item) => (
            <div key={item.label} className="grid grid-cols-1 gap-1 sm:grid-cols-[200px_1fr] sm:gap-6">
              <dt className="text-sm font-semibold text-ink-primary">{item.label}</dt>
              <dd className="text-sm leading-relaxed text-ink-muted">{item.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
