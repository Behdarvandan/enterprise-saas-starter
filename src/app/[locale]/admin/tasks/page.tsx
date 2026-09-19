import { getTranslations } from "next-intl/server";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { requireOperatorAdmin } from "@/lib/operator";
import TaskBoard from "./TaskBoard";

export const dynamic = "force-dynamic";

export default async function AdminTasksPage() {
  const { supabase } = await requireOperatorAdmin();
  const t = await getTranslations("admin.tasks");

  const { data: tasks } = await supabase
    .from("internal_tasks")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <PageContainer className="max-w-7xl">
      <PageHeader title={t("title")} description={t("description")} />
      <TaskBoard tasks={tasks ?? []} />
    </PageContainer>
  );
}
