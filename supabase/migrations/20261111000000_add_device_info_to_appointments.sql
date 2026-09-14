-- ============================================================================
-- Nimbus SaaS — Repair-shop appointment fields
-- ----------------------------------------------------------------------------
-- Adds optional device/issue capture to appointments so repair-shop tenants
-- can record what's being serviced and the customer's description of the
-- problem. Both columns are nullable so the booking flow stays generic —
-- tenants that don't need them (e.g. salons, consultants) simply leave them
-- null. No RLS changes required: existing row-level policies on
-- `appointments` already cover these new columns.
-- ============================================================================

alter table public.appointments
  add column device_info text,
  add column issue_description text;
