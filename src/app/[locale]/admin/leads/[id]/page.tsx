import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { requireOperatorAdmin } from "@/lib/operator";
import Badge from "@/components/ui/Badge";
import type { LeadStatus } from "@/types";
import LeadActions from "./LeadActions";

export const dynamic = "force-dynamic";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminLeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const { supabase } = await requireOperatorAdmin();

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!lead) notFound();

  const { data: project } = await supabase
    .from("client_projects")
    .select("id, organization_id")
    .eq("lead_id", lead.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-2 text-sm font-semibold text-violet-dim hover:text-violet"
      >
        <ArrowLeft size={16} />
        Back to pipeline
      </Link>

      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-primary">{lead.full_name}</h1>
          <p className="mt-1 text-sm text-ink-muted">{lead.email}</p>
        </div>
        <Badge tone={lead.kind === "saas" ? "neutral" : "warn"}>{lead.kind}</Badge>
      </div>

      <div className="animate-reveal-up mt-8 rounded-interactive border border-subtle bg-surface p-6">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Phone
            </dt>
            <dd className="mt-1 text-sm text-ink-primary">{lead.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Project type
            </dt>
            <dd className="mt-1 text-sm text-ink-primary">
              {lead.project_category?.replaceAll("_", " ") ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Working mode
            </dt>
            <dd className="mt-1 text-sm text-ink-primary">
              {lead.working_mode?.replaceAll("_", " ") ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Source
            </dt>
            <dd className="mt-1 text-sm text-ink-primary">{lead.source ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Submitted
            </dt>
            <dd className="mt-1 text-sm text-ink-primary">
              {new Date(lead.created_at).toLocaleDateString()}
            </dd>
          </div>
        </dl>

        {lead.message && (
          <div className="mt-6 border-t border-subtle pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Short description
            </p>
            <p className="mt-1 text-sm text-ink-primary">{lead.message}</p>
          </div>
        )}

        {lead.project_scope && (
          <div className="mt-6 border-t border-subtle pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Follow-up answer
            </p>
            <p className="mt-1 text-sm text-ink-primary">{lead.project_scope}</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <LeadActions
          leadId={lead.id}
          status={lead.status as LeadStatus}
          convertedOrganizationId={project?.organization_id ?? null}
        />
      </div>
    </div>
  );
}
