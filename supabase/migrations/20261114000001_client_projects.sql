-- ============================================================================
-- Nimbus SaaS — Client projects (freelance project tracking)
-- ----------------------------------------------------------------------------
-- Tables:      client_projects
-- ----------------------------------------------------------------------------
-- A client-org member gets read-only visibility into their own project's
-- status; the operator (admin CRM) has full read/write access via
-- `is_operator_admin()`. Admin-initiated writes are expected to come from
-- service-role API routes (see src/lib/operator.ts), not a tenant-facing
-- UI, so tenant members are granted SELECT only — never INSERT/UPDATE/DELETE.
-- ============================================================================

create table public.client_projects (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lead_id         uuid references public.leads (id) on delete set null,
  name            text not null,
  stage           text not null default 'design'
                    check (stage in ('design', 'backend', 'test', 'live')),
  repo_url        text,
  live_url        text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_client_projects_organization_stage on public.client_projects (organization_id, stage);

create trigger trg_client_projects_updated_at
  before update on public.client_projects
  for each row execute procedure public.set_updated_at();

alter table public.client_projects enable row level security;

-- Tenant member: read-only visibility into their own organization's projects.
create policy "client_projects_select_member"
  on public.client_projects for select
  using (public.is_org_member(organization_id));

-- Operator admin: full CRUD across every organization's projects, for the
-- admin CRM/Kanban. Evaluated against the fixed operator organization
-- (is_operator_admin), not the row's own organization_id — so this policy
-- cannot be satisfied by tricking it with an attacker-controlled org id, the
-- same class of bug migration 20261113000002 fixed for the anon RPCs.
create policy "client_projects_all_operator_admin"
  on public.client_projects for all
  using (public.is_operator_admin())
  with check (public.is_operator_admin());
