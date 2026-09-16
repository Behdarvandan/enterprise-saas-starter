-- ============================================================================
-- Nimbus SaaS — Operator identity seed
-- ----------------------------------------------------------------------------
-- Links a specific user to the operator organization as owner via the
-- `memberships` junction table. There is NO `organization_id` column on
-- `profiles` in this schema — every organization relationship (tenant
-- membership, and the operator/admin concept built on top of it) goes
-- through `memberships`, matched against RLS via `is_org_member()` /
-- `current_user_role()` (see supabase/migrations/20240101000000_init_schema.sql
-- and 20240101000001_rls_policies.sql). `profiles.portal_kind` is a
-- routing-only hint (never read by RLS) — see 20261114000000_operator_
-- portal_and_leads.sql.
--
-- This is NOT a schema migration — it only writes data, tailored to one
-- environment's operator identity — and is not part of supabase/migrations/.
-- Run it manually, once, against the target project:
--
--   npx supabase db query --linked --file supabase/seed-operator.sql
--
-- Safe to re-run: every step is idempotent (updates by primary key, or an
-- upsert on the natural unique constraint already in the schema).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Rename the already-configured operator organization to "Nimbus HQ".
-- `platform_settings.operator_organization_id` already points at an org
-- named "purya.behdarvandan's Workspace" — the default workspace
-- auto-created by `ensureOrganization()` (src/lib/billing.ts) the first
-- time this user signed in. Renaming it in place keeps
-- `platform_settings` untouched and avoids leaving a second, orphaned
-- organization behind.
--
-- Heads-up: this also changes the org's public booking slug to
-- "nimbus-hq". If anyone has bookmarked a /book/<old-slug> link against
-- this specific organization, that link would break — unlikely for an
-- auto-generated onboarding workspace, but worth knowing before running
-- this in an environment where that org has real booking traffic.
-- ----------------------------------------------------------------------------
update public.organizations
set name = 'Nimbus HQ', slug = 'nimbus-hq'
where id = (select operator_organization_id from public.platform_settings);

-- ----------------------------------------------------------------------------
-- 2) Link the operator user to that organization as owner.
-- This is the actual root cause of the /admin authorization gap: every
-- operator-only RLS policy and the requireOperatorAdmin() guard both
-- evaluate is_operator_admin(), which checks
-- current_user_role(operator_organization_id) — a `memberships` lookup.
-- There was no membership row for this user in that organization at all
-- (not even a stale/wrong-role one), so the check failed for every
-- request, regardless of `profiles.portal_kind`.
-- ----------------------------------------------------------------------------
insert into public.memberships (user_id, organization_id, role)
select
  'acfee20d-1796-4fd3-976d-c48bbbce49b7',
  operator_organization_id,
  'owner'
from public.platform_settings
on conflict (user_id, organization_id) do update set role = 'owner';

-- ----------------------------------------------------------------------------
-- 3) Confirm portal_kind = 'operator' for this user (routing hint only,
-- not read by RLS — already set on this project, included so this script
-- fully re-establishes the operator identity on its own).
-- ----------------------------------------------------------------------------
update public.profiles
set portal_kind = 'operator'
where id = 'acfee20d-1796-4fd3-976d-c48bbbce49b7';
