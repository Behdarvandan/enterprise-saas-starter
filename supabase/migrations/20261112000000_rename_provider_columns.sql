-- ============================================================================
-- Nimbus SaaS — Provider-agnostic payment column names
-- ----------------------------------------------------------------------------
-- Both Stripe and PayTR write through the shared handler layer
-- (`src/lib/payment/handlers.ts`), so the Stripe-specific column names on
-- `organizations` and `appointments` no longer reflect reality. This renames
-- them to provider-agnostic equivalents. Renames are metadata-only: no data
-- is rewritten, and all constraints/indexes are preserved (just renamed).
--
-- `create_organization()` and `accept_invitation()` (both `returns public.
-- organizations` via `select *` / `returning *`) need no changes: the
-- composite row type follows the column rename automatically.
-- ============================================================================

alter table public.organizations
  rename column stripe_customer_id to provider_customer_id;
alter table public.organizations
  rename column stripe_subscription_id to provider_subscription_id;

alter index if exists idx_organizations_stripe_customer_id
  rename to idx_organizations_provider_customer_id;
alter index if exists idx_organizations_stripe_subscription_id
  rename to idx_organizations_provider_subscription_id;

alter table public.appointments
  rename column stripe_payment_intent_id to provider_payment_intent_id;

alter index if exists idx_appointments_payment_intent_unique
  rename to idx_appointments_provider_payment_intent_unique;
