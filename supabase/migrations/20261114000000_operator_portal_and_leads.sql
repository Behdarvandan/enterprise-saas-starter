-- ============================================================================
-- Nimbus SaaS — Operator portal, platform settings, and lead intake
-- ----------------------------------------------------------------------------
-- Tables:      platform_settings, leads
-- Enums:       portal_kind
-- Columns:     profiles.portal_kind
-- Functions:   is_operator_admin, submit_lead
-- ----------------------------------------------------------------------------
-- `portal_kind` is a UI-routing hint only ('operator' sends a signed-in user
-- to /admin, 'tenant' sends them to /client or /dashboard) — it is never
-- referenced by an RLS policy. All authorization continues to flow through
-- the existing `is_org_member()` / `current_user_role()` helpers, evaluated
-- against the single "operator organization" recorded in
-- `platform_settings`. This keeps the freelance-ops/admin/customer split a
-- purely presentational concept layered on top of the existing per-org
-- membership model, rather than a second, parallel authorization system.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUMS / COLUMNS
-- ----------------------------------------------------------------------------
create type public.portal_kind as enum ('operator', 'tenant');

alter table public.profiles
  add column portal_kind public.portal_kind not null default 'tenant';

-- ----------------------------------------------------------------------------
-- PLATFORM_SETTINGS
-- Singleton row identifying the operator's own organization. Seeded manually
-- post-deploy (one `insert` per environment) — a specific organization id
-- cannot be safely hardcoded in a migration that runs across environments.
-- ----------------------------------------------------------------------------
create table public.platform_settings (
  id                       boolean primary key default true check (id),
  operator_organization_id uuid not null references public.organizations (id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create trigger trg_platform_settings_updated_at
  before update on public.platform_settings
  for each row execute procedure public.set_updated_at();

alter table public.platform_settings enable row level security;

-- Readable by members of the operator organization; writes are performed
-- with the service-role client only (no insert/update/delete policy here).
create policy "platform_settings_select_operator_member"
  on public.platform_settings for select
  using (public.is_org_member(operator_organization_id));

-- ----------------------------------------------------------------------------
-- HELPER: is the caller an owner/admin of the operator organization?
-- SECURITY DEFINER + fixed search_path, matching is_org_member/
-- current_user_role, so it can be referenced from RLS policies on other
-- tables without recursive-policy issues. Resolves the operator org id from
-- `platform_settings` rather than a hardcoded literal so the same migration
-- works unchanged across every environment.
-- ----------------------------------------------------------------------------
create or replace function public.is_operator_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select public.current_user_role(ps.operator_organization_id) in ('owner', 'admin')
      from public.platform_settings ps
      limit 1
    ),
    false
  );
$$;

-- ----------------------------------------------------------------------------
-- LEADS
-- Pre-tenant prospects (freelance or SaaS) submitted through the public
-- marketing site. Always attributed to the operator organization — a lead
-- belongs to the freelancer's own CRM, not to a customer tenant, so
-- `organization_id` is NOT NULL (never a nullable "not yet assigned" FK,
-- which would complicate every RLS predicate on this table).
-- ----------------------------------------------------------------------------
create table public.leads (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind            text not null check (kind in ('saas', 'freelance')),
  full_name       text not null,
  email           text not null,
  phone           text,
  company         text,
  budget_range    text,
  project_scope   text,
  deadline        date,
  message         text,
  status          text not null default 'new'
                    check (status in ('new', 'quoted', 'accepted', 'completed', 'rejected')),
  source          text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_leads_organization_status on public.leads (organization_id, status);

create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute procedure public.set_updated_at();

alter table public.leads enable row level security;

-- Leads are an operator-only CRM tool: no plain-member read, since a
-- 'member' of the operator org shouldn't automatically see the sales
-- pipeline. Only owner/admin of the operator org (is_operator_admin) can
-- read, update, or delete a lead.
create policy "leads_select_operator_admin"
  on public.leads for select
  using (public.is_operator_admin());

create policy "leads_update_operator_admin"
  on public.leads for update
  using (public.is_operator_admin())
  with check (public.is_operator_admin());

create policy "leads_delete_operator_admin"
  on public.leads for delete
  using (public.is_operator_admin());

-- Deliberately no INSERT policy: rows are only ever created through the
-- `submit_lead()` SECURITY DEFINER RPC below, called by anonymous visitors.

-- ----------------------------------------------------------------------------
-- submit_lead
-- Anonymous lead-intake entrypoint for the public contact form. Hardcodes
-- `organization_id` to the operator organization server-side — unlike the
-- booking/chat anon RPCs, the caller never supplies (or can override) a
-- tenant id, since every lead belongs to the same operator CRM.
-- ----------------------------------------------------------------------------
create or replace function public.submit_lead(
  p_kind          text,
  p_full_name     text,
  p_email         text,
  p_phone         text,
  p_company       text,
  p_budget_range  text,
  p_project_scope text,
  p_deadline      date,
  p_message       text,
  p_source        text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operator_org_id uuid;
  v_lead_id uuid;
begin
  select operator_organization_id into v_operator_org_id
  from public.platform_settings
  limit 1;

  if v_operator_org_id is null then
    raise exception 'Platform settings are not configured.' using errcode = 'P0003';
  end if;

  insert into public.leads (
    organization_id, kind, full_name, email, phone, company,
    budget_range, project_scope, deadline, message, source
  )
  values (
    v_operator_org_id, p_kind, p_full_name, p_email, p_phone, p_company,
    p_budget_range, p_project_scope, p_deadline, p_message, p_source
  )
  returning id into v_lead_id;

  return v_lead_id;
end;
$$;

-- Migration-12 lesson applied from day one: Supabase grants EXECUTE on new
-- public-schema functions to anon/authenticated/service_role by default
-- regardless of `revoke ... from public`, so `authenticated` is revoked
-- explicitly in this same migration instead of a follow-up fix.
revoke all on function public.submit_lead(
  text, text, text, text, text, text, text, date, text, text
) from public;
grant execute on function public.submit_lead(
  text, text, text, text, text, text, text, date, text, text
) to anon;
revoke execute on function public.submit_lead(
  text, text, text, text, text, text, text, date, text, text
) from authenticated;
