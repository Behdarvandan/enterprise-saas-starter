import { requireOperatorAdmin } from "@/lib/operator";
import TaskBoard from "./TaskBoard";

export const dynamic = "force-dynamic";

export default async function AdminTasksPage() {
  const { supabase } = await requireOperatorAdmin();

  const { data: tasks } = await supabase
    .from("internal_tasks")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-ink-primary">Internal tasks</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Your own operational work — not visible to clients.
      </p>

      <div className="animate-reveal-up mt-8">
        <TaskBoard tasks={tasks ?? []} />
      </div>
    </div>
  );
}
