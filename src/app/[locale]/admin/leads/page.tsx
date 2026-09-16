import { requireOperatorAdmin } from "@/lib/operator";
import LeadPipelineBoard from "./LeadPipelineBoard";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const { supabase } = await requireOperatorAdmin();

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-ink-primary">Lead pipeline</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Track incoming SaaS and freelance requests through to conversion.
      </p>

      <div className="mt-8">
        <LeadPipelineBoard leads={leads ?? []} />
      </div>
    </div>
  );
}
