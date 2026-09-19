import { Building2 } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import Badge from "@/components/ui/Badge";
import { Card } from "@/components/ui/card";
import EmptyState from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { asLeadCategory, asProjectStage, asWorkingMode } from "@/lib/admin/enums";
import { requireOperatorAdmin } from "@/lib/operator";

export const dynamic = "force-dynamic";

/**
 * Active vs on-hold isn't specced beyond the column name: this uses project
 * delivery stage as the signal — still in design/backend/test means an active
 * engagement, "live" means delivered and dormant unless a new invoice or
 * request reopens it. Revisit if a real definition (e.g. tied to open
 * invoices) turns out to matter more.
 */
function isActive(stage: string): boolean {
  return stage !== "live";
}

export default async function AdminClientsPage() {
  const { supabase } = await requireOperatorAdmin();
  const [t, tLeads, format] = await Promise.all([
    getTranslations("admin.clients"),
    getTranslations("admin.leads"),
    getFormatter(),
  ]);

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
    <PageContainer className="max-w-7xl">
      <PageHeader title={t("title")} description={t("description")} />

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Building2} title={t("emptyTitle")} description={t("emptyDescription")} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.client")}</TableHead>
                  <TableHead>{t("columns.projectType")}</TableHead>
                  <TableHead>{t("columns.workingMode")}</TableHead>
                  <TableHead>{t("columns.status")}</TableHead>
                  <TableHead>{t("columns.lastActivity")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((project) => {
                  const org = orgById.get(project.organization_id);
                  const lead = project.lead_id ? leadById.get(project.lead_id) : undefined;
                  const stage = asProjectStage(project.stage);
                  const category = asLeadCategory(lead?.project_category);
                  const mode = asWorkingMode(lead?.working_mode);
                  const active = isActive(project.stage);
                  const name = org?.name ?? project.name;

                  return (
                    <TableRow key={project.id}>
                      <TableCell>
                        {project.lead_id ? (
                          <Link href={`/admin/leads/${project.lead_id}`} className="font-medium text-slate-100 hover:text-violet-300">
                            {name}
                          </Link>
                        ) : (
                          <span className="font-medium text-slate-100">{name}</span>
                        )}
                        <p className="text-xs text-slate-400">{stage ? t(`stage.${stage}`) : project.stage}</p>
                      </TableCell>
                      <TableCell className="text-slate-400">{category ? tLeads(`categories.${category}`) : "—"}</TableCell>
                      <TableCell className="text-slate-400">{mode ? tLeads(`modes.${mode}`) : "—"}</TableCell>
                      <TableCell>
                        <Badge tone={active ? "success" : "neutral"}>{active ? t("state.active") : t("state.dormant")}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {format.dateTime(new Date(project.updated_at), { dateStyle: "medium" })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
