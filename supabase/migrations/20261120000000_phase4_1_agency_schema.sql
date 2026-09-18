-- ============================================================================
-- Pasargad Phase 4.1 — Agency hierarchy, RLS, and BYOK credential storage
-- ----------------------------------------------------------------------------
-- Tables:      agencies, agency_tenants, agency_llm_credentials
-- Functions:   is_agency_admin, is_agency_admin_of_tenant, consume_agency_quota
-- ----------------------------------------------------------------------------
-- An agency is a reseller that owns a "master" organization and manages a set
-- of child tenant organizations (`agency_tenants`). Authorization keeps
-- flowing through the existing `current_user_role()` helper: an agency admin
-- is an owner/admin of the agency's master organization, mirroring how
-- `is_operator_admin()` resolves the operator organization.
--
-- Agency admins get SELECT-only visibility into their child tenants' data;
-- every write (including `quota_allocation`) stays operator/service-role only.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- AGENCIES
-- ----------------------------------------------------------------------------
create table public.agencies (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  cname_domain     text unique,
  branding         jsonb not null default '{}'::jsonb,
  master_tenant_id uuid not null references public.organizations (id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_agencies_master_tenant_id on public.agencies (master_tenant_id);

create trigger trg_agencies_updated_at
  before update on public.agencies
  for each row execute procedure public.set_updated_at();

alter table public.agencies enable row level security;

-- ----------------------------------------------------------------------------
-- AGENCY_TENANTS
-- `quota_allocation` is the child tenant's remaining token pool, decremented
-- by `consume_agency_quota` after each RAG chat turn. `unique (tenant_id)`
-- pins a tenant to a single agency so the backend's tenant -> agency lookup
-- is never ambiguous.
-- ----------------------------------------------------------------------------
create table public.agency_tenants (
  agency_id        uuid not null references public.agencies (id) on delete cascade,
  tenant_id        uuid not null references public.organizations (id) on delete cascade,
  quota_allocation integer not null default 0 check (quota_allocation >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (agency_id, tenant_id),
  unique (tenant_id)
);

create trigger trg_agency_tenants_updated_at
  before update on public.agency_tenants
  for each row execute procedure public.set_updated_at();

alter table public.agency_tenants enable row level security;

-- ----------------------------------------------------------------------------
-- AGENCY_LLM_CREDENTIALS (BYOK)
-- One encrypted provider API key per (agency, provider). The ciphertext is
-- produced/consumed by pasargad-core (Fernet, AGENCY_KEY_ENCRYPTION_SECRET);
-- the database never sees a plaintext key. RLS is enabled with no policies,
-- so only the service-role key can read or write this table — keys must never
-- be client-readable, not even by the agency's own admins.
-- ----------------------------------------------------------------------------
create table public.agency_llm_credentials (
  agency_id     uuid not null references public.agencies (id) on delete cascade,
  provider      text not null check (provider in ('openai', 'gemini', 'deepseek')),
  encrypted_key text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (agency_id, provider)
);

create trigger trg_agency_llm_credentials_updated_at
  before update on public.agency_llm_credentials
  for each row execute procedure public.set_updated_at();

alter table public.agency_llm_credentials enable row level security;

-- ----------------------------------------------------------------------------
-- HELPER: is the caller an owner/admin of the agency's master organization?
-- SECURITY DEFINER + fixed search_path, matching is_org_member/
-- is_operator_admin, so it can be referenced from RLS policies on other
-- tables without recursive-policy issues.
-- ----------------------------------------------------------------------------
create or replace function public.is_agency_admin(p_agency_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select public.current_user_role(a.master_tenant_id) in ('owner', 'admin')
      from public.agencies a
      where a.id = p_agency_id
    ),
    false
  );
$$;

-- ----------------------------------------------------------------------------
-- HELPER: is the caller an admin of the agency that manages `p_tenant_id`?
-- Collapses the tenant -> agency join used by every child-tenant read policy
-- below into one place.
-- ----------------------------------------------------------------------------
create or replace function public.is_agency_admin_of_tenant(p_tenant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.agency_tenants at
    where at.tenant_id = p_tenant_id
      and public.is_agency_admin(at.agency_id)
  );
$$;

-- ----------------------------------------------------------------------------
-- consume_agency_quota
-- Atomic single-statement decrement so concurrent chat turns for the same
-- tenant can never lose an update to a read-then-write race. Floors at 0
-- (the CHECK constraint would otherwise reject an overshoot and fail the
-- whole call). Returns the remaining balance, or NULL when the tenant does
-- not belong to any agency.
-- ----------------------------------------------------------------------------
create or replace function public.consume_agency_quota(
  p_tenant_id uuid,
  p_tokens integer
)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.agency_tenants
  set quota_allocation = greatest(quota_allocation - greatest(p_tokens, 0), 0)
  where tenant_id = p_tenant_id
  returning quota_allocation;
$$;

revoke all on function public.consume_agency_quota(uuid, integer) from public;
revoke execute on function public.consume_agency_quota(uuid, integer) from anon;
revoke execute on function public.consume_agency_quota(uuid, integer) from authenticated;
grant execute on function public.consume_agency_quota(uuid, integer) to service_role;

-- ----------------------------------------------------------------------------
-- RLS POLICIES
-- ----------------------------------------------------------------------------
create policy "agencies_select_agency_admin"
  on public.agencies for select
  using (public.is_agency_admin(id));

create policy "agencies_all_operator_admin"
  on public.agencies for all
  using (public.is_operator_admin())
  with check (public.is_operator_admin());

create policy "agency_tenants_select_agency_admin"
  on public.agency_tenants for select
  using (public.is_agency_admin(agency_id));

-- Only the operator may (re)allocate quota; an agency admin cannot raise
-- their own tenants' limits.
create policy "agency_tenants_all_operator_admin"
  on public.agency_tenants for all
  using (public.is_operator_admin())
  with check (public.is_operator_admin());

-- Agency admins read their child tenants' data (SELECT only), in addition to
-- each table's existing member/operator policies.
create policy "organizations_select_agency_admin"
  on public.organizations for select
  using (public.is_agency_admin_of_tenant(id));

create policy "usage_quotas_select_agency_admin"
  on public.usage_quotas for select
  using (public.is_agency_admin_of_tenant(organization_id));

create policy "audit_logs_select_agency_admin"
  on public.audit_logs for select
  using (public.is_agency_admin_of_tenant(organization_id));

create policy "chat_sessions_select_agency_admin"
  on public.chat_sessions for select
  using (public.is_agency_admin_of_tenant(organization_id));

create policy "chat_messages_select_agency_admin"
  on public.chat_messages for select
  using (public.is_agency_admin_of_tenant(organization_id));
