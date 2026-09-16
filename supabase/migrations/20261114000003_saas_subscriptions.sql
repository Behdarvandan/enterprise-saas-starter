-- ============================================================================
-- Nimbus SaaS — SaaS customer license & API key management
-- ----------------------------------------------------------------------------
-- Tables:      saas_subscriptions
-- ----------------------------------------------------------------------------
-- Distinct from the billing columns already on `organizations`
-- (provider_customer_id/provider_subscription_id/subscription_status,
-- see 20240101000002_subscriptions.sql): this table tracks the *license* an
-- organization holds (tier, seats, API key), not payment provider state.
-- A member reads their own org's row for the client-portal license screen;
-- owner/admin of that same org can self-serve rotate the API key; the
-- operator admin has full override access.
-- ============================================================================

create table public.saas_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  license_key     text not null unique default encode(gen_random_bytes(24), 'hex'),
  api_key_hash    text, -- hash only; the raw key is shown once on generation/rotation
  tier            text not null default 'starter',
  seats           integer not null default 1 check (seats > 0),
  status          text not null default 'active'
                    check (status in ('active', 'suspended', 'cancelled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_saas_subscriptions_organization on public.saas_subscriptions (organization_id);

create trigger trg_saas_subscriptions_updated_at
  before update on public.saas_subscriptions
  for each row execute procedure public.set_updated_at();

alter table public.saas_subscriptions enable row level security;

create policy "saas_subscriptions_select_member"
  on public.saas_subscriptions for select
  using (public.is_org_member(organization_id));

-- Self-serve key rotation: owner/admin of the subscription's own org.
create policy "saas_subscriptions_update_own_admin"
  on public.saas_subscriptions for update
  using (public.current_user_role(organization_id) in ('owner', 'admin'))
  with check (public.current_user_role(organization_id) in ('owner', 'admin'));

create policy "saas_subscriptions_all_operator_admin"
  on public.saas_subscriptions for all
  using (public.is_operator_admin())
  with check (public.is_operator_admin());
