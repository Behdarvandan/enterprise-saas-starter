-- ============================================================================
-- Pasargad Phase 4.3 — Agency portal: quota pool, tenant management RPCs,
-- consolidated usage summary
-- ----------------------------------------------------------------------------
-- Columns:     agencies.quota_pool, agency_tenants.quota_granted
-- Functions:   get_my_agency, allocate_agency_tenant_quota, link_agency_tenant,
--              create_agency_tenant, unlink_agency_tenant,
--              get_agency_usage_summary, is_organization_serviceable (replaced)
-- ----------------------------------------------------------------------------
-- `agencies` / `agency_tenants` have no agency-admin write policy (4.1: only
-- the operator writes). The portal lets an agency admin manage their own
-- tenants, so each write goes through a SECURITY DEFINER function that
-- re-checks `is_agency_admin()` itself — the authorization stays in Postgres
-- rather than in application code. Errors carry a stable machine key as the
-- message (mapped to UI copy by the Server Actions) and a SQLSTATE.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- COLUMNS
-- `quota_pool`   total tokens the operator has made available to the agency.
-- `quota_granted` tokens allocated to a tenant for the current period;
--                 consumption = quota_granted - quota_allocation (the
--                 remaining balance that consume_agency_quota decrements).
-- ----------------------------------------------------------------------------
alter table public.agencies
  add column quota_pool integer not null default 0 check (quota_pool >= 0);

alter table public.agency_tenants
  add column quota_granted integer not null default 0 check (quota_granted >= 0);

-- Existing rows have consumed nothing tracked yet: what remains was granted.
update public.agency_tenants set quota_granted = quota_allocation;

-- ----------------------------------------------------------------------------
-- get_my_agency
-- The agency the caller administers (oldest first), or no row. Resolved
-- through is_agency_admin() rather than plain RLS visibility on `agencies`:
-- the operator can *see* every agency (agencies_all_operator_admin) without
-- administering any, and must not be treated as an agency admin by the portal.
-- SECURITY INVOKER — the caller's own RLS still applies on top.
-- ----------------------------------------------------------------------------
create or replace function public.get_my_agency()
returns table (
  id                uuid,
  name              text,
  cname_domain      text,
  cname_status      text,
  cname_verified_at timestamptz,
  branding          jsonb,
  master_tenant_id  uuid,
  quota_pool        integer
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    a.id, a.name, a.cname_domain, a.cname_status, a.cname_verified_at,
    a.branding, a.master_tenant_id, a.quota_pool
  from public.agencies a
  where public.is_agency_admin(a.id)
  order by a.created_at
  limit 1;
$$;

-- ----------------------------------------------------------------------------
-- allocate_agency_tenant_quota
-- Sets a tenant's total budget for the period. The agency row is locked so
-- concurrent allocations serialize and the pool can never be oversubscribed;
-- the tenant row is locked so it also serializes against consume_agency_quota.
-- Consumption so far is preserved (re-allocating never refunds used tokens).
-- Returns the tenant's remaining balance.
-- ----------------------------------------------------------------------------
create or replace function public.allocate_agency_tenant_quota(
  p_agency_id uuid,
  p_tenant_id uuid,
  p_total integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pool     integer;
  v_granted  integer;
  v_alloc    integer;
  v_consumed integer;
  v_others   bigint;
begin
  if not public.is_agency_admin(p_agency_id) then
    raise exception 'not_agency_admin' using errcode = 'insufficient_privilege';
  end if;

  if p_total is null or p_total < 0 then
    raise exception 'invalid_quota' using errcode = 'invalid_parameter_value';
  end if;

  select a.quota_pool into v_pool
  from public.agencies a
  where a.id = p_agency_id
  for update;

  select at.quota_granted, at.quota_allocation into v_granted, v_alloc
  from public.agency_tenants at
  where at.agency_id = p_agency_id and at.tenant_id = p_tenant_id
  for update;

  if not found then
    raise exception 'tenant_not_in_agency' using errcode = 'no_data_found';
  end if;

  v_consumed := greatest(v_granted - v_alloc, 0);
  if p_total < v_consumed then
    raise exception 'quota_below_consumed' using errcode = 'invalid_parameter_value';
  end if;

  select coalesce(sum(at.quota_granted), 0) into v_others
  from public.agency_tenants at
  where at.agency_id = p_agency_id and at.tenant_id <> p_tenant_id;

  if v_others + p_total > v_pool then
    raise exception 'quota_pool_exceeded' using errcode = 'check_violation';
  end if;

  update public.agency_tenants at
  set quota_granted = p_total,
      quota_allocation = p_total - v_consumed
  where at.agency_id = p_agency_id and at.tenant_id = p_tenant_id;

  return p_total - v_consumed;
end;
$$;

-- ----------------------------------------------------------------------------
-- link_agency_tenant
-- Attaches an existing organization to the agency. Linking exposes the tenant's
-- chats/audit to the agency admin (4.1 RLS), so the caller must be an OWNER of
-- that organization: nobody can attach another customer's organization.
-- ----------------------------------------------------------------------------
create or replace function public.link_agency_tenant(
  p_agency_id uuid,
  p_tenant_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_master uuid;
begin
  if not public.is_agency_admin(p_agency_id) then
    raise exception 'not_agency_admin' using errcode = 'insufficient_privilege';
  end if;

  if public.current_user_role(p_tenant_id) is distinct from 'owner' then
    raise exception 'not_tenant_owner' using errcode = 'insufficient_privilege';
  end if;

  select a.master_tenant_id into v_master from public.agencies a where a.id = p_agency_id;
  if v_master = p_tenant_id then
    raise exception 'tenant_is_master' using errcode = 'invalid_parameter_value';
  end if;

  begin
    insert into public.agency_tenants (agency_id, tenant_id) values (p_agency_id, p_tenant_id);
  exception when unique_violation then
    raise exception 'tenant_already_linked' using errcode = 'unique_violation';
  end;
end;
$$;

-- ----------------------------------------------------------------------------
-- create_agency_tenant
-- Creates a brand-new organization, makes the caller its owner, and links it —
-- one atomic call, so a failed link never leaves an orphan organization.
-- Returns the new organization id.
-- ----------------------------------------------------------------------------
create or replace function public.create_agency_tenant(
  p_agency_id uuid,
  p_name text,
  p_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if not public.is_agency_admin(p_agency_id) then
    raise exception 'not_agency_admin' using errcode = 'insufficient_privilege';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'invalid_name' using errcode = 'invalid_parameter_value';
  end if;
  if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug) not between 3 and 48 then
    raise exception 'invalid_slug' using errcode = 'invalid_parameter_value';
  end if;

  begin
    insert into public.organizations (name, slug)
    values (btrim(p_name), p_slug)
    returning id into v_org_id;
  exception when unique_violation then
    raise exception 'slug_taken' using errcode = 'unique_violation';
  end;

  insert into public.memberships (user_id, organization_id, role)
  values (auth.uid(), v_org_id, 'owner');

  insert into public.agency_tenants (agency_id, tenant_id) values (p_agency_id, v_org_id);

  return v_org_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- unlink_agency_tenant
-- Detaches a tenant. The organization and its data are untouched; the agency
-- loses access and the tenant's allocation returns to the pool.
-- ----------------------------------------------------------------------------
create or replace function public.unlink_agency_tenant(
  p_agency_id uuid,
  p_tenant_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_agency_admin(p_agency_id) then
    raise exception 'not_agency_admin' using errcode = 'insufficient_privilege';
  end if;

  delete from public.agency_tenants at
  where at.agency_id = p_agency_id and at.tenant_id = p_tenant_id;

  if not found then
    raise exception 'tenant_not_in_agency' using errcode = 'no_data_found';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- get_agency_usage_summary
-- Per-tenant usage for the agency analytics board. SECURITY INVOKER on
-- purpose: every table read below is filtered by the caller's own RLS (the
-- 4.1 *_select_agency_admin policies), and the explicit is_agency_admin()
-- predicate makes a non-admin get an empty result rather than relying on RLS
-- alone. Window (`p_days`, clamped to 1..365) applies to requests/completions;
-- token consumption is the current allocation (quota_granted - remaining).
-- ----------------------------------------------------------------------------
create or replace function public.get_agency_usage_summary(
  p_agency_id uuid,
  p_days integer default 30
)
returns table (
  tenant_id        uuid,
  tenant_name      text,
  tenant_slug      text,
  quota_granted    integer,
  quota_allocation integer,
  rag_requests     bigint,
  completions      bigint,
  low_confidence   bigint,
  quota_exhausted  bigint,
  last_activity_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    at.tenant_id,
    o.name,
    o.slug,
    at.quota_granted,
    at.quota_allocation,
    coalesce(m.requests, 0)::bigint,
    coalesce(l.completions, 0)::bigint,
    coalesce(l.low_conf, 0)::bigint,
    coalesce(l.exhausted, 0)::bigint,
    greatest(m.last_at, l.last_at)
  from public.agency_tenants at
  join public.organizations o on o.id = at.tenant_id
  left join lateral (
    select
      count(*) filter (where cm.role = 'user') as requests,
      max(cm.created_at) as last_at
    from public.chat_messages cm
    where cm.organization_id = at.tenant_id
      and cm.created_at >= now() - make_interval(days => least(greatest(p_days, 1), 365))
  ) m on true
  left join lateral (
    select
      count(*) as completions,
      count(*) filter (where al.metadata ->> 'low_confidence' = 'true') as low_conf,
      count(*) filter (where al.metadata ->> 'status' = 'quota_exhausted') as exhausted,
      max(al.created_at) as last_at
    from public.audit_logs al
    where al.organization_id = at.tenant_id
      and al.action = 'chat.completion'
      and al.created_at >= now() - make_interval(days => least(greatest(p_days, 1), 365))
  ) l on true
  where at.agency_id = p_agency_id
    and public.is_agency_admin(p_agency_id)
  order by o.name;
$$;

-- ----------------------------------------------------------------------------
-- is_organization_serviceable (replaces the 20261113000000 definition)
-- An agency's child tenants have no subscription of their own — the agency
-- pays — so they are serviceable while the agency's master organization has
-- an active/trialing subscription. Behavior for organizations that are not
-- agency tenants is unchanged.
-- ----------------------------------------------------------------------------
create or replace function public.is_organization_serviceable(
  p_organization_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(
      (
        select o.subscription_status in ('active', 'trialing')
        from public.organizations o
        where o.id = p_organization_id
      ),
      false
    )
    or exists (
      select 1
      from public.agency_tenants at
      join public.agencies a on a.id = at.agency_id
      join public.organizations m on m.id = a.master_tenant_id
      where at.tenant_id = p_organization_id
        and m.subscription_status in ('active', 'trialing')
    );
$$;

-- ----------------------------------------------------------------------------
-- GRANTS
-- Portal RPCs are called with the signed-in user's own session; each one
-- re-checks is_agency_admin() internally, so `authenticated` is the only
-- role that gets EXECUTE.
-- ----------------------------------------------------------------------------
revoke all on function public.get_my_agency() from public;
revoke all on function public.allocate_agency_tenant_quota(uuid, uuid, integer) from public;
revoke all on function public.link_agency_tenant(uuid, uuid) from public;
revoke all on function public.create_agency_tenant(uuid, text, text) from public;
revoke all on function public.unlink_agency_tenant(uuid, uuid) from public;
revoke all on function public.get_agency_usage_summary(uuid, integer) from public;

-- Supabase's default privileges grant EXECUTE to anon on new functions, which
-- `revoke ... from public` does not undo.
revoke execute on function public.get_my_agency() from anon;
revoke execute on function public.allocate_agency_tenant_quota(uuid, uuid, integer) from anon;
revoke execute on function public.link_agency_tenant(uuid, uuid) from anon;
revoke execute on function public.create_agency_tenant(uuid, text, text) from anon;
revoke execute on function public.unlink_agency_tenant(uuid, uuid) from anon;
revoke execute on function public.get_agency_usage_summary(uuid, integer) from anon;

grant execute on function public.get_my_agency() to authenticated;
grant execute on function public.allocate_agency_tenant_quota(uuid, uuid, integer) to authenticated;
grant execute on function public.link_agency_tenant(uuid, uuid) to authenticated;
grant execute on function public.create_agency_tenant(uuid, text, text) to authenticated;
grant execute on function public.unlink_agency_tenant(uuid, uuid) to authenticated;
grant execute on function public.get_agency_usage_summary(uuid, integer) to authenticated;
