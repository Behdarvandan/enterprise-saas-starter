-- ============================================================================
-- Pasargad — persist the last CNAME check (monitoring panel)
-- ----------------------------------------------------------------------------
-- Columns:   agencies.cname_last_checked_at, agencies.cname_last_records
-- Functions: reset_agency_cname_status (replaced)
-- ----------------------------------------------------------------------------
-- `cname_verified_at` is only set when a check succeeds, so a `failed` or
-- `pending` domain gave the portal nothing to show about *when* it was last
-- checked or *what DNS currently points at*. These two columns record the
-- outcome of every check made by POST /api/agency/cname/verify, so the
-- monitoring panel can show "last checked" and the records seen even after a
-- page reload. Written by the service-role client only (no agency-admin write
-- policy exists on `agencies`).
-- ============================================================================

alter table public.agencies
  add column if not exists cname_last_checked_at timestamptz,
  add column if not exists cname_last_records text[] not null default '{}';

-- A changed domain invalidates the previous check too: never show DNS records
-- that were observed for a different hostname.
create or replace function public.reset_agency_cname_status()
returns trigger
language plpgsql
as $$
begin
  if new.cname_domain is distinct from old.cname_domain then
    new.cname_status = 'pending';
    new.cname_verified_at = null;
    new.cname_last_checked_at = null;
    new.cname_last_records = '{}';
  end if;
  return new;
end;
$$;
