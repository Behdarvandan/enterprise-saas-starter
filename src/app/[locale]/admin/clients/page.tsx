import { Link } from "@/i18n/navigation";
import { requireOperatorAdmin } from "@/lib/operator";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

const STAGE_LABELS: Record<string, string> = {
  design: "Tasarım",
  backend: "Geliştirme",
  test: "Test",
  live: "Yayında",
};

/**
 * "Aktif/Beklemede" isn't specced beyond the column name (brief §5.4) — this
 * uses project delivery stage as the default signal: still in
 * design/backend/test means active engagement, "live" means delivered and
 * dormant unless a new invoice or request reopens it. Revisit if a real
 * definition (e.g. tied to open invoices) turns out to matter more.
 */
function clientStatus(stage: string): { label: string; tone: "success" | "neutral" } {
  return stage === "live"
    ? { label: "Beklemede", tone: "neutral" }
    : { label: "Aktif", tone: "success" };
}

export default async function AdminClientsPage() {
  const { supabase } = await requireOperatorAdmin();

  const { data: projects } = await supabase
    .from("client_projects")
    .select("id, organization_id, lead_id, name, stage, updated_at")
    .order("updated_at", { ascending: false });

  const orgIds = [...new Set((projects ?? []).map((p) => p.organization_id))];
  const leadIds = [...new Set((projects ?? []).flatMap((p) => (p.lead_id ? [p.lead_id] : [])))];

  const [{ data: organizations }, { data: leads }] = await Promise.all([
    orgIds.length > 0
      ? supabase.from("organizations").select("id, name").in("id", orgIds)
      : Promise.resolve({ data: [] }),
    leadIds.length > 0
      ? supabase.from("leads").select("id, project_category, working_mode").in("id", leadIds)
      : Promise.resolve({ data: [] }),
  ]);

  const orgById = new Map((organizations ?? []).map((o) => [o.id, o]));
  const leadById = new Map((leads ?? []).map((l) => [l.id, l]));

  const rows = projects ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-semibold text-ink-primary">Müşteriler</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Dönüştürülmüş her lead&apos;in proje takibi — teslim durumu ve son aktivite.
      </p>

      <div className="mt-8 overflow-hidden rounded-interactive border border-subtle bg-surface">
        {rows.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Henüz müşteri yok"
            description="Bir lead 'Kabul Edildi' aşamasında müşteriye dönüştürüldüğünde burada görünecek."
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-subtle bg-surface-raised text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Müşteri</th>
                <th className="px-4 py-3">Proje tipi</th>
                <th className="px-4 py-3">Çalışma şekli</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Son aktivite</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((project) => {
                const org = orgById.get(project.organization_id);
                const lead = project.lead_id ? leadById.get(project.lead_id) : undefined;
                const status = clientStatus(project.stage);
                return (
                  <tr key={project.id} className="border-b border-subtle last:border-0">
                    <td className="px-4 py-3">
                      {project.lead_id ? (
                        <Link
                          href={`/admin/leads/${project.lead_id}`}
                          className="font-medium text-ink-primary hover:text-violet-dim"
                        >
                          {org?.name ?? project.name}
                        </Link>
                      ) : (
                        <span className="font-medium text-ink-primary">
                          {org?.name ?? project.name}
                        </span>
                      )}
                      <p className="text-xs text-ink-muted">
                        {STAGE_LABELS[project.stage] ?? project.stage}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {lead?.project_category?.replaceAll("_", " ") ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {lead?.working_mode?.replaceAll("_", " ") ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
