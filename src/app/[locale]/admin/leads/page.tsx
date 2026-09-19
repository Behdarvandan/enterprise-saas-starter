import { getTranslations } from "next-intl/server";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { requireOperatorAdmin } from "@/lib/operator";
import LeadPipelineBoard from "./LeadPipelineBoard";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const { supabase } = await requireOperatorAdmin();
  const t = await getTranslations("admin.leads");

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <PageContainer className="max-w-7xl">
      <PageHeader title={t("title")} description={t("description")} />
      <LeadPipelineBoard leads={leads ?? []} />
    </PageContainer>
  );
}
