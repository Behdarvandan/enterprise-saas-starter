-- ----------------------------------------------------------------------------
-- Pasargad services quote form (brief §4.3/§4.4): the public lead form now
-- asks for one of 4 fixed project categories and an optional working-mode
-- preference instead of a budget range, and lives on /services only (the
-- /saas page no longer captures leads). `budget_range`/`deadline` are left
-- in place (existing rows keep their data) but are no longer written to by
-- `submit_lead` — dropping them outright isn't worth the churn for two
-- unused nullable columns.
-- ----------------------------------------------------------------------------

alter table public.leads
  add column project_category text
    check (project_category in (
      'fullstack_saas', 'ai_automation', 'architecture_security', 'payment_subscription'
    )),
  add column working_mode text
    check (working_mode in ('hourly', 'project', 'either'));

drop function if exists public.submit_lead(
  text, text, text, text, text, text, text, date, text, text
);

create or replace function public.submit_lead(
  p_kind             text,
  p_full_name        text,
  p_email            text,
  p_phone            text,
  p_company          text,
  p_project_category text,
  p_working_mode     text,
  p_project_scope    text,
  p_message          text,
  p_source           text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operator_org_id uuid;
  v_lead_id uuid;
begin
  select operator_organization_id into v_operator_org_id
  from public.platform_settings
  limit 1;

  if v_operator_org_id is null then
    raise exception 'Platform settings are not configured.' using errcode = 'P0003';
  end if;

  insert into public.leads (
    organization_id, kind, full_name, email, phone, company,
    project_category, working_mode, project_scope, message, source
  )
  values (
    v_operator_org_id, p_kind, p_full_name, p_email, p_phone, p_company,
    p_project_category, p_working_mode, p_project_scope, p_message, p_source
  )
  returning id into v_lead_id;

  return v_lead_id;
end;
$$;

-- Migration-12 lesson applied from day one (see 20261114000000): Supabase
-- grants EXECUTE on new public-schema functions to anon/authenticated/
-- service_role by default regardless of `revoke ... from public`, so
-- `authenticated` is revoked explicitly in this same migration.
revoke all on function public.submit_lead(
  text, text, text, text, text, text, text, text, text, text
) from public;
grant execute on function public.submit_lead(
  text, text, text, text, text, text, text, text, text, text
) to anon;
revoke execute on function public.submit_lead(
  text, text, text, text, text, text, text, text, text, text
) from authenticated;
