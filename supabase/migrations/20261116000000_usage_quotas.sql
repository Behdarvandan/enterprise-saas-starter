-- ============================================================================
-- Nimbus SaaS — RAG chat token usage quotas
-- ----------------------------------------------------------------------------
-- Tables:      usage_quotas
-- Functions:   increment_token_usage
-- ----------------------------------------------------------------------------
-- One row per organization (unique `organization_id`), tracking token
-- consumption for the RAG chat endpoint over a rolling period. Members can
-- see their own org's quota (e.g. a future "usage" panel); only the
-- operator admin can write directly (manual limit overrides). The actual
-- per-request increment (`/api/chat/rag`) and the period rollover cron both
-- go through the service-role client, which bypasses RLS entirely — the
-- policies below only govern what a signed-in *user* can do.
-- ============================================================================

create table public.usage_quotas (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  period_start    timestamptz not null default now(),
  tokens_used     integer not null default 0,
  tokens_limit    integer not null default 100000,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_usage_quotas_updated_at
  before update on public.usage_quotas
  for each row execute procedure public.set_updated_at();

alter table public.usage_quotas enable row level security;

create policy "usage_quotas_select_member"
  on public.usage_quotas for select
  using (public.is_org_member(organization_id));

create policy "usage_quotas_all_operator_admin"
  on public.usage_quotas for all
  using (public.is_operator_admin())
  with check (public.is_operator_admin());

-- ----------------------------------------------------------------------------
-- increment_token_usage
-- Atomic upsert so concurrent chat requests for the same organization can
-- never lose an increment to a read-then-write race (which a plain
-- select-then-update from application code would risk). Creates the row on
-- an organization's first chat request instead of requiring a separate
-- seed step.
-- ----------------------------------------------------------------------------
create or replace function public.increment_token_usage(
  p_organization_id uuid,
  p_tokens integer
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.usage_quotas (organization_id, tokens_used, period_start)
  values (p_organization_id, greatest(p_tokens, 0), now())
  on conflict (organization_id)
  do update set tokens_used = public.usage_quotas.tokens_used + greatest(p_tokens, 0);
$$;

revoke all on function public.increment_token_usage(uuid, integer) from public;
revoke execute on function public.increment_token_usage(uuid, integer) from anon;
revoke execute on function public.increment_token_usage(uuid, integer) from authenticated;
grant execute on function public.increment_token_usage(uuid, integer) to service_role;
