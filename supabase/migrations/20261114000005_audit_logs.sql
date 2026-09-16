-- ============================================================================
-- Nimbus SaaS — Audit logging
-- ----------------------------------------------------------------------------
-- Tables:      audit_logs
-- Functions:   write_audit_log
-- ----------------------------------------------------------------------------
-- Audit logs are an operator-facing feature in v1 (visible only to the
-- operator admin, not to tenant orgs). There is deliberately no INSERT
-- policy for any role — every write goes through `write_audit_log()`, which
-- is itself restricted to `service_role` only, so application code must
-- call it via `createAdminClient()` (mirroring the pattern already used in
-- src/lib/payment/handlers.ts for other privileged writes).
-- ============================================================================

create table public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  actor_id        uuid references public.profiles (id) on delete set null,
  action          text not null, -- e.g. "lead.status_changed", "invoice.created"
  target_table    text,
  target_id       uuid,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index idx_audit_logs_organization_created_at on public.audit_logs (organization_id, created_at desc);

alter table public.audit_logs enable row level security;

create policy "audit_logs_select_operator_admin"
  on public.audit_logs for select
  using (public.is_operator_admin());

-- ----------------------------------------------------------------------------
-- write_audit_log
-- Thin SECURITY DEFINER insert wrapper. Grant is restricted to service_role
-- only (belt-and-suspenders on top of the table having no INSERT policy at
-- all) — anon/authenticated can never call this, by grant or by RLS.
-- ----------------------------------------------------------------------------
create or replace function public.write_audit_log(
  p_action          text,
  p_organization_id uuid,
  p_actor_id        uuid,
  p_target_table    text,
  p_target_id       uuid,
  p_metadata        jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.audit_logs (
    organization_id, actor_id, action, target_table, target_id, metadata
  )
  values (
    p_organization_id, p_actor_id, p_action, p_target_table, p_target_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.write_audit_log(
  text, uuid, uuid, text, uuid, jsonb
) from public;
revoke execute on function public.write_audit_log(
  text, uuid, uuid, text, uuid, jsonb
) from anon;
revoke execute on function public.write_audit_log(
  text, uuid, uuid, text, uuid, jsonb
) from authenticated;
grant execute on function public.write_audit_log(
  text, uuid, uuid, text, uuid, jsonb
) to service_role;
