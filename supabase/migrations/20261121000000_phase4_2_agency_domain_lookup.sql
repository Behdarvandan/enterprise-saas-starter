-- ============================================================================
-- Pasargad Phase 4.2 — Custom-domain (CNAME) verification state + anon lookup
-- ----------------------------------------------------------------------------
-- Columns:     agencies.cname_status, agencies.cname_verified_at
-- Functions:   get_agency_by_domain, reset_agency_cname_status (trigger)
-- ----------------------------------------------------------------------------
-- The Edge middleware resolves an incoming custom domain (Host header) to an
-- agency for anonymous visitors. `agencies` is RLS-restricted to agency admins
-- (4.1), so the lookup goes through a narrow SECURITY DEFINER RPC instead of
-- widening table access or shipping the service-role key to the Edge runtime.
-- Only *verified* (`active`) domains are served, and only a whitelist of
-- public branding keys is ever returned.
-- ============================================================================

alter table public.agencies
  add column cname_status text not null default 'pending'
    check (cname_status in ('pending', 'active', 'failed')),
  add column cname_verified_at timestamptz,
  -- Stored lowercase so lookups can hit the existing unique btree index on
  -- `cname_domain` directly, without a lower() wrapper defeating it.
  add constraint agencies_cname_domain_lowercase
    check (cname_domain is null or cname_domain = lower(cname_domain));

-- ----------------------------------------------------------------------------
-- A changed domain must be re-verified: reset the status so a stale `active`
-- never lets branding be served on a domain nobody has proven yet.
-- ----------------------------------------------------------------------------
create or replace function public.reset_agency_cname_status()
returns trigger
language plpgsql
as $$
begin
  if new.cname_domain is distinct from old.cname_domain then
    new.cname_status = 'pending';
    new.cname_verified_at = null;
  end if;
  return new;
end;
$$;

create trigger trg_agencies_reset_cname_status
  before update of cname_domain on public.agencies
  for each row execute procedure public.reset_agency_cname_status();

-- ----------------------------------------------------------------------------
-- get_agency_by_domain
-- Resolves a verified custom domain to its agency. Branding is rebuilt from a
-- whitelist (logo_url / primary_color / title) so any other key later stored
-- in `agencies.branding` can never leak through this anonymous endpoint.
-- ----------------------------------------------------------------------------
create or replace function public.get_agency_by_domain(p_domain text)
returns table (
  id uuid,
  master_tenant_id uuid,
  branding jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select
    a.id,
    a.master_tenant_id,
    jsonb_strip_nulls(jsonb_build_object(
      'logo_url',      a.branding -> 'logo_url',
      'primary_color', a.branding -> 'primary_color',
      'title',         a.branding -> 'title'
    )) as branding
  from public.agencies a
  where a.cname_domain = lower(p_domain)
    and a.cname_status = 'active'
  limit 1;
$$;

revoke all on function public.get_agency_by_domain(text) from public;
grant execute on function public.get_agency_by_domain(text) to anon, authenticated;
