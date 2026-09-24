create table public.tenant_usage (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete cascade,
  period_start      timestamptz not null default date_trunc('month', now()),
  api_calls_count   integer not null default 0,
  token_usage_count integer not null default 0,
  updated_at        timestamptz not null default now(),
  unique (organization_id, period_start)
);

create trigger trg_tenant_usage_updated_at
  before update on public.tenant_usage
  for each row execute procedure public.set_updated_at();

alter table public.tenant_usage enable row level security;

create policy "tenant_usage_select_member"
  on public.tenant_usage for select
  using (public.is_org_member(organization_id));

-- ----------------------------------------------------------------------------
-- increment_tenant_usage
-- Atomic upsert (same rationale as usage_quotas's increment_token_usage:
-- avoids a read-then-write race between concurrent requests for the same
-- org/period). Granted to `authenticated` (not service-role-only) since
-- callers are signed-in tenant users incrementing their own org's usage;
-- the membership check below is the actual authorization boundary.
-- ----------------------------------------------------------------------------
create or replace function public.increment_tenant_usage(
  p_organization_id uuid,
  p_metric text,
  p_count integer default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_org_member(p_organization_id) then
    raise exception 'not a member of this organization';
  end if;

  if p_metric = 'api_calls' then
    insert into public.tenant_usage (organization_id, period_start, api_calls_count)
    values (p_organization_id, date_trunc('month', now()), greatest(p_count, 0))
    on conflict (organization_id, period_start)
    do update set api_calls_count = public.tenant_usage.api_calls_count + greatest(p_count, 0);
  elsif p_metric = 'tokens' then
    insert into public.tenant_usage (organization_id, period_start, token_usage_count)
    values (p_organization_id, date_trunc('month', now()), greatest(p_count, 0))
    on conflict (organization_id, period_start)
    do update set token_usage_count = public.tenant_usage.token_usage_count + greatest(p_count, 0);
  else
    raise exception 'unknown metric: %', p_metric;
  end if;
end;
$$;

revoke all on function public.increment_tenant_usage(uuid, text, integer) from public;
revoke execute on function public.increment_tenant_usage(uuid, text, integer) from anon;
grant execute on function public.increment_tenant_usage(uuid, text, integer) to authenticated;
grant execute on function public.increment_tenant_usage(uuid, text, integer) to service_role;
