-- ============================================================================
-- pasargad-core -- Tenant daily token usage (reliability backlog Step 2)
-- ----------------------------------------------------------------------------
-- Why a separate table, not a reuse of enterprise-saas-starter's existing
-- usage tables (same shared database):
--   - usage_quotas: one row TOTAL per organization (unique(organization_id)),
--     no day dimension; period_start rolls over on an external, apparently
--     billing-cycle cadence. That is this product's COMMERCIAL ROLLING
--     QUOTA, not a per-day agent-run guard.
--   - tenant_usage: has a period dimension, but its RPC
--     (increment_tenant_usage) hardcodes date_trunc('month', now()) --
--     MONTHLY, not daily -- and is granted to `authenticated` with an
--     org-membership check, i.e. written by a signed-in tenant user, not a
--     service-role backend.
-- Neither fits a UTC-day bucket written by a service-role backend without a
-- sibling-repo schema change (out of scope here).
--
-- pasargad-core's own token spend is NOT YET reflected in usage_quotas
-- (that commercial rolling quota) -- reconciling the two is a later product
-- decision, not part of this step.
--
-- Note: this repo's own 001_initial_schema.sql defines a local
-- public.tenants/auth_tenant_id() that do NOT exist in the real, deployed
-- shared database -- the actual tenant table there is public.organizations
-- (enterprise-saas-starter's), with membership checked via
-- public.is_org_member(). This migration targets the real deployed schema.
-- ============================================================================

create table if not exists public.tenant_daily_token_usage (
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  usage_date date not null,
  tokens_used bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, usage_date)
);

alter table public.tenant_daily_token_usage enable row level security;

create policy "tenant_daily_token_usage_select_member" on public.tenant_daily_token_usage
  for select using (public.is_org_member(tenant_id));

-- ----------------------------------------------------------------------------
-- consume_tenant_daily_tokens
-- security definer, revoked from anon/authenticated, granted to
-- service_role only -- called exclusively from pasargad-core's backend
-- (service-role key, no auth.uid()), so an is_org_member check inside the
-- function (as tenant_usage's increment_tenant_usage does for signed-in
-- callers) does not apply here; restricting WHO can call the function at
-- all is the gate (same reasoning as usage_quotas's increment_token_usage).
-- ----------------------------------------------------------------------------
create or replace function public.consume_tenant_daily_tokens(
  p_tenant_id uuid,
  p_tokens bigint,
  p_day date
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.tenant_daily_token_usage (tenant_id, usage_date, tokens_used)
  values (p_tenant_id, p_day, greatest(p_tokens, 0))
  on conflict (tenant_id, usage_date)
  do update set
    tokens_used = public.tenant_daily_token_usage.tokens_used + greatest(excluded.tokens_used, 0),
    updated_at = now();
$$;

revoke all on function public.consume_tenant_daily_tokens(uuid, bigint, date) from public;
revoke execute on function public.consume_tenant_daily_tokens(uuid, bigint, date) from anon;
revoke execute on function public.consume_tenant_daily_tokens(uuid, bigint, date) from authenticated;
grant execute on function public.consume_tenant_daily_tokens(uuid, bigint, date) to service_role;
