-- ============================================================================
-- Nimbus SaaS — Repair Shop Demo Seed Data
-- ----------------------------------------------------------------------------
-- Creates a standalone demo organization ("Repair Shop Demo") with sample
-- services and a Mon-Fri 9:00-17:00 availability schedule, so the public
-- booking flow (/book/repair-shop-demo) can be demoed end-to-end without
-- touching any real tenant's data.
--
-- This is NOT a schema migration — it only inserts data — and is not part of
-- `supabase/migrations/`. Run it manually, once, against the target project:
--
--   npx supabase db query --linked --file supabase/seed-repair-shop-demo.sql
--
-- Safe to re-run: the organization and services use fixed, deterministic ids
-- with `on conflict (id) do nothing`; availability_slots relies on its own
-- natural unique constraint (organization_id, day_of_week, start_time,
-- end_time).
--
-- IMPORTANT: subscription_status is set to 'trialing', not the column
-- default 'inactive'. Both /api/checkout/booking and /api/chat/rag gate on
-- `isOrganizationServiceable()`, which only treats 'active' or 'trialing'
-- organizations as bookable — an 'inactive' demo org would make every
-- checkout attempt fail with "This service is not currently available."
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ORGANIZATION
-- ----------------------------------------------------------------------------
insert into public.organizations (id, name, slug, subscription_status)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Repair Shop Demo',
  'repair-shop-demo',
  'trialing'
)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- SERVICES
-- `price` is in minor currency units (cents). "Data Recovery Consultation" is
-- intentionally priced at 0 so the demo also exercises the free/instant-
-- confirm booking path (no Stripe redirect) alongside the paid ones.
-- ----------------------------------------------------------------------------
insert into public.services
  (id, organization_id, name, description, duration_minutes, price, is_active)
values
  (
    'aaaaaaaa-0000-0000-0000-000000000011',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Phone Screen Replacement',
    'Cracked or unresponsive screen replacement for most phone models.',
    45, 8900, true
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000012',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Laptop Diagnostic',
    'Full hardware and software diagnostic to identify the root cause of an issue.',
    30, 2900, true
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000013',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Battery Replacement',
    'Replace a degraded phone or laptop battery with a new, genuine-spec one.',
    30, 4900, true
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000014',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Data Recovery Consultation',
    'Assessment of recoverable data from a damaged or failing drive.',
    20, 0, true
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000015',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Water Damage Assessment',
    'Inspection and cleaning assessment for a liquid-damaged device.',
    30, 3900, true
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- AVAILABILITY
-- Mon-Fri, 09:00-17:00. `day_of_week` follows Postgres's extract(dow)
-- convention (0 = Sunday ... 6 = Saturday), matching the column's own
-- constraint, so Mon-Fri is 1-5.
-- ----------------------------------------------------------------------------
insert into public.availability_slots
  (organization_id, day_of_week, start_time, end_time, is_active)
select
  'aaaaaaaa-0000-0000-0000-000000000001',
  dow,
  '09:00',
  '17:00',
  true
from generate_series(1, 5) as dow
on conflict (organization_id, day_of_week, start_time, end_time) do nothing;
