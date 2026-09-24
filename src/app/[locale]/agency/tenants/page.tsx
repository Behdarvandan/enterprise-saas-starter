import { Building2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import AddTenantDialog from "@/components/agency/AddTenantDialog";
import QuotaMeter from "@/components/agency/QuotaMeter";
import TenantTable, { type TenantRowData } from "@/components/agency/TenantTable";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Card } from "@/core/ui/primitives/card";
import EmptyState from "@/components/ui/EmptyState";
import MetricCard from "@/components/ui/MetricCard";
import { requireAgencyAdmin } from "@/lib/agency/admin";
import { formatPercent, formatTokens } from "@/lib/agency/format";
import { getLinkableOrganizations } from "@/lib/agency/linkable";
import { getAllowedAgencySkills, readEnabledSkills } from "@/lib/agency/skills";
import { summarizePool } from "@/lib/agency/usage";
import { DEFAULT_ENABLED_SKILLS } from "@/lib/skills-catalog";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AgencyTenantsPage() {
  const { supabase, user, agency } = await requireAgencyAdmin();
  const [t, locale] = await Promise.all([getTranslations("agency.tenants"), getLocale()]);

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

  const [allowedSkills, linkable] = await Promise.all([
    getAllowedAgencySkills(supabase, agency),
    getLinkableOrganizations(supabase, user.id, agency),
  ]);

  const tenants: TenantRowData[] = (links ?? []).map((link) => ({
    tenantId: link.tenant_id,
    name: link.organizations?.name ?? t("untitled"),
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
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={tenants.length > 0 ? <AddTenantDialog linkable={linkable} /> : null}
      />

      <section aria-label={t("pool.title")} className="grid gap-4 sm:grid-cols-3">
        <MetricCard label={t("pool.pool")} value={formatTokens(locale, pool.pool)} />
        <MetricCard label={t("pool.allocated")} value={formatTokens(locale, pool.allocated)} />
        <MetricCard label={t("pool.available")} value={formatTokens(locale, pool.unallocated)}>
          <QuotaMeter tone="neutral" percent={pool.percentAllocated} label={t("pool.meter")} />
        </MetricCard>
      </section>
      <p className="-mt-2 text-xs text-slate-400">
        {pool.pool > 0
          ? t("pool.allocatedShare", { percent: formatPercent(locale, pool.percentAllocated) })
          : t("pool.empty")}
      </p>

      <Card>
        {tenants.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={<AddTenantDialog linkable={linkable} variant="first" />}
          />
        ) : (
          <TenantTable tenants={tenants} allowedSkills={allowedSkills} poolUnallocated={pool.unallocated} />
        )}
      </Card>
    </PageContainer>
  );
}
