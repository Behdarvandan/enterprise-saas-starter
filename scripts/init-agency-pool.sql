-- =============================================================================
-- Operator script: fund an agency's token pool
-- =============================================================================
-- WHEN: right after launch, once per agency, and whenever you top a pool up.
-- An agency admin can only allocate tokens to their tenants out of
-- `agencies.quota_pool`; the pool starts at 0, so until this runs the agency
-- portal (/agency/tenants) cannot allocate anything. Only the operator can
-- change the pool (the `agencies` table has no agency-admin write policy).
--
-- HOW: this is NOT a migration and never runs automatically. Review it, edit
-- the two values in the `_pool_params` row below, and run it by hand against
-- the production database:
--   * Supabase dashboard -> SQL Editor (paste and run), or
--   * psql "$DATABASE_URL" -f scripts/init-agency-pool.sql
--
-- UNIT: tokens (the same unit as `agency_tenants.quota_allocation`, which the
-- chat backend decrements per request). 1000000 = one million tokens.
--
-- PREREQUISITE: the `agencies` row must already exist, with `cname_domain` set
-- (there is no UI for creating agencies; create the row first). The domain is
-- stored lowercase.
--
-- SAFETY: everything runs in one transaction, and the script sets the pool to
-- an absolute value (it does not add to it), so running it twice is harmless.
-- It aborts, changing nothing, if
--   * no agency (or more than one) matches the domain -- e.g. a typo, or this
--     example domain left unchanged; or
--   * the new pool is smaller than what is already allocated to tenants.
--
-- NEXT: the agency admin then divides the pool between tenants in the portal
-- (total allocated across tenants can never exceed the pool).
-- =============================================================================

begin;

-- >>> EDIT HERE: the agency's custom domain and the pool to grant (tokens). <<<
create temp table _pool_params on commit drop as
select
  'demo.ajansadi.com'::text as cname_domain,
  1000000::integer          as quota_pool;

-- 1. Preview: what will be changed. (agency columns are null if no match.)
select
  a.id,
  a.name,
  p.cname_domain,
  a.quota_pool as current_pool,
  p.quota_pool as new_pool
from _pool_params p
left join public.agencies a on a.cname_domain = p.cname_domain;

-- 2. Guarded update.
do $$
declare
  v_domain    text;
  v_pool      integer;
  v_agency_id uuid;
  v_allocated bigint;
begin
  select p.cname_domain, p.quota_pool into v_domain, v_pool from _pool_params p;

  -- cname_domain is unique, so this finds at most one agency.
  select a.id into v_agency_id
  from public.agencies a
  where a.cname_domain = v_domain;

  if v_agency_id is null then
    raise exception 'init-agency-pool: no agency has cname_domain %; nothing was changed', v_domain;
  end if;

  select coalesce(sum(t.quota_granted), 0) into v_allocated
  from public.agency_tenants t
  where t.agency_id = v_agency_id;

  if v_pool < v_allocated then
    raise exception
      'init-agency-pool: new pool % is below the % tokens already allocated to tenants; nothing was changed',
      v_pool, v_allocated;
  end if;

  update public.agencies
  set quota_pool = v_pool
  where id = v_agency_id;
end;
$$;

-- 3. Result: the pool, what tenants already hold, and what is left to allocate.
select
  a.id,
  a.name,
  a.cname_domain,
  a.quota_pool,
  coalesce(sum(t.quota_granted), 0)                 as allocated,
  a.quota_pool - coalesce(sum(t.quota_granted), 0)  as available
from public.agencies a
join _pool_params p on p.cname_domain = a.cname_domain
left join public.agency_tenants t on t.agency_id = a.id
group by a.id, a.name, a.cname_domain, a.quota_pool;

commit;
