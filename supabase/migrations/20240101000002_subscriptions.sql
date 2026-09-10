-- ============================================================================
-- Nimbus SaaS — Stripe subscription tracking
-- ----------------------------------------------------------------------------
-- Adds billing fields to `organizations` so a tenant's subscription state can
-- be stored and updated by the Stripe webhook handler.
-- ============================================================================

alter table public.organizations
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists plan_id text,
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists current_period_end timestamptz;

-- Fast lookups by Stripe identifiers (used by the webhook handler).
create unique index if not exists idx_organizations_stripe_customer_id
  on public.organizations (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists idx_organizations_stripe_subscription_id
  on public.organizations (stripe_subscription_id)
  where stripe_subscription_id is not null;
