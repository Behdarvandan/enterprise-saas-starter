-- ============================================================================
-- Nimbus SaaS — SSO/SAML architectural readiness (Faz 1 Decision 5)
-- ----------------------------------------------------------------------------
-- Tables:      sso_connections
-- Enums:       sso_provider
-- ----------------------------------------------------------------------------
-- This is storage only — no working SSO/SAML flow ships with this
-- migration. There is no callback route and no login-page button reading
-- from this table yet; `src/lib/sso/adapter.ts` stubs the actual
-- login/callback methods. Only the operator (is_operator_admin()) can
-- configure a connection — an enterprise customer's SSO setup is done by
-- the operator on their behalf, not self-served by the tenant, since no UI
-- exists for it yet either.
-- ============================================================================

create type public.sso_provider as enum ('okta', 'google_workspace');

create table public.sso_connections (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider        public.sso_provider not null,
  config          jsonb not null default '{}'::jsonb,
  enabled         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_sso_connections_organization on public.sso_connections (organization_id);

create trigger trg_sso_connections_updated_at
  before update on public.sso_connections
  for each row execute procedure public.set_updated_at();

alter table public.sso_connections enable row level security;

create policy "sso_connections_all_operator_admin"
  on public.sso_connections for all
  using (public.is_operator_admin())
  with check (public.is_operator_admin());
