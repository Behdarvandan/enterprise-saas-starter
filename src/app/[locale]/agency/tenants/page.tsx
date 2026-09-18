import { Building2 } from "lucide-react";
import AddTenantDialog from "@/components/agency/AddTenantDialog";
import QuotaMeter from "@/components/agency/QuotaMeter";
import TenantTable, { type TenantRowData } from "@/components/agency/TenantTable";
import { Card } from "@/components/ui/card";
import EmptyState from "@/components/ui/EmptyState";
import { requireAgencyAdmin } from "@/lib/agency/admin";
import { formatPercent, formatTokens } from "@/lib/agency/format";
import { getAllowedAgencySkills, readEnabledSkills } from "@/lib/agency/skills";
import { summarizePool } from "@/lib/agency/usage";
import { DEFAULT_ENABLED_SKILLS } from "@/lib/payment/handlers";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AgencyTenantsPage() {
  const { supabase, agency } = await requireAgencyAdmin();

  const { data: links, error } = await supabase
    .from("agency_tenants")
    .select("tenant_id, quota_allocation, quota_granted, organizations ( name, slug )")
    .eq("agency_id", agency.id)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const tenantIds = (links ?? []).map((link) => link.tenant_id);

  // tenant_configs has no client-readable RLS policy (service-role only), so
  // the skill state is read with the admin client — scoped to this agency's
  // own tenant ids, which were just resolved through the caller's RLS.
  const enabledByTenant = new Map<string, string[]>();
  if (tenantIds.length > 0) {
    const { data: configs, error: configError } = await createAdminClient()
      .from("tenant_configs")
      .select("tenant_id, version, config")
      .in("tenant_id", tenantIds)
      .eq("is_active", true)
      .order("version", { ascending: false });
    if (configError) throw configError;

    // Highest active version wins (rows arrive newest first).
    for (const row of configs ?? []) {
      if (!enabledByTenant.has(row.tenant_id)) {
        enabledByTenant.set(row.tenant_id, readEnabledSkills(row.config) ?? DEFAULT_ENABLED_SKILLS);
      }
    }
  }

  const allowedSkills = await getAllowedAgencySkills(supabase, agency);

  const tenants: TenantRowData[] = (links ?? []).map((link) => ({
    tenantId: link.tenant_id,
    name: link.organizations?.name ?? "Untitled organization",
    slug: link.organizations?.slug ?? "",
    granted: link.quota_granted,
    remaining: link.quota_allocation,
    enabledSkills: enabledByTenant.get(link.tenant_id) ?? DEFAULT_ENABLED_SKILLS,
  }));

  const pool = summarizePool(
    agency.quota_pool,
    tenants.map((tenant) => ({ quota_granted: tenant.granted })),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-primary">Tenants</h1>
          <p className="mt-1 text-sm text-ink-muted">
            The client organizations you manage. Allocate tokens from your pool and choose the
            skills each assistant can use.
          </p>
        </div>
        {tenants.length > 0 ? <AddTenantDialog /> : null}
      </div>

      <Card className="animate-reveal-up mt-8 rounded-interactive p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          <h2 className="text-sm font-semibold text-ink-primary">Token pool</h2>
          <dl className="flex flex-wrap gap-x-8 gap-y-2 font-mono text-sm">
            <div>
              <dt className="text-xs text-ink-muted">Pool</dt>
              <dd className="text-ink-primary">{formatTokens(pool.pool)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Allocated</dt>
              <dd className="text-ink-primary">{formatTokens(pool.allocated)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Available</dt>
              <dd className="text-ink-primary">{formatTokens(pool.unallocated)}</dd>
            </div>
          </dl>
        </div>
        <QuotaMeter
          tone="neutral"
          percent={pool.percentAllocated}
          label="Share of the token pool allocated to tenants"
          className="mt-4"
        />
        <p className="mt-2 text-xs text-ink-muted">
          {pool.pool > 0
            ? `${formatPercent(pool.percentAllocated)} of your pool is allocated to tenants.`
            : "Your token pool is empty, so tokens can't be allocated yet. Contact the platform team to have a pool assigned."}
        </p>
      </Card>

      <Card
        className="animate-reveal-up mt-6 rounded-interactive"
        style={{ animationDelay: "60ms" }}
      >
        {tenants.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No tenants yet"
            description="Create a new client organization, or link one you already own, to start managing it here."
            action={<AddTenantDialog triggerLabel="Add your first tenant" />}
          />
        ) : (
          <TenantTable
            tenants={tenants}
            allowedSkills={allowedSkills}
            poolUnallocated={pool.unallocated}
          />
        )}
      </Card>
    </div>
  );
}
