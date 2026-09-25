import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/layout/PageHeader";
import { Badge } from "@/core/ui/primitives/badge";
import { Card } from "@/core/ui/primitives/card";
import { Link } from "@/i18n/navigation";
import { asLeadCategory, asLeadStatus, asWorkingMode } from "@/lib/admin/enums";
import { requireOperatorAdmin } from "@/lib/operator";
import LeadActions from "./LeadActions";

export const dynamic = "force-dynamic";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminLeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const { supabase } = await requireOperatorAdmin();
  const [t, format] = await Promise.all([getTranslations("admin.leads"), getFormatter()]);

  const { data: lead } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (!lead) notFound();

  const { data: project } = await supabase
    .from("client_projects")
    .select("id, organization_id")
    .eq("lead_id", lead.id)
    .maybeSingle();

  const category = asLeadCategory(lead.project_category);
  const mode = asWorkingMode(lead.working_mode);

  const fields = [
    { label: t("detail.phone"), value: lead.phone ?? "—", ltr: true },
    { label: t("detail.projectType"), value: category ? t(`categories.${category}`) : "—" },
    { label: t("detail.workingMode"), value: mode ? t(`modes.${mode}`) : "—" },
    { label: t("detail.source"), value: lead.source ?? "—" },
    { label: t("detail.submitted"), value: format.dateTime(new Date(lead.created_at), { dateStyle: "medium" }) },
  ];

  return (
    <PageContainer className="max-w-3xl">
      <Link href="/admin/leads" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover">
        <ArrowLeft aria-hidden size={16} className="rtl:rotate-180" />
        {t("detail.back")}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">{lead.full_name}</h1>
          <p dir="ltr" className="mt-1 text-start text-sm text-slate-400">
            {lead.email}
          </p>
        </div>
        <Badge variant={lead.kind === "saas" ? "secondary" : "outline"}>
          {lead.kind === "saas" ? t("kind.saas") : t("kind.freelance")}
        </Badge>
      </div>

      <Card className="p-6">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-medium text-slate-400">{field.label}</dt>
              <dd dir={field.ltr ? "ltr" : undefined} className="mt-1 text-start text-sm text-slate-100">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>

        {lead.message ? (
          <div className="mt-6 border-t border-slate-800 pt-4">
            <p className="text-xs font-medium text-slate-400">{t("detail.message")}</p>
            <p className="mt-1 text-sm whitespace-pre-wrap text-slate-100">{lead.message}</p>
          </div>
        ) : null}

        {lead.project_scope ? (
          <div className="mt-6 border-t border-slate-800 pt-4">
            <p className="text-xs font-medium text-slate-400">{t("detail.scope")}</p>
            <p className="mt-1 text-sm whitespace-pre-wrap text-slate-100">{lead.project_scope}</p>
          </div>
        ) : null}
      </Card>

      <LeadActions
        leadId={lead.id}
        status={asLeadStatus(lead.status) ?? "new"}
        convertedOrganizationId={project?.organization_id ?? null}
      />
    </PageContainer>
  );
}
