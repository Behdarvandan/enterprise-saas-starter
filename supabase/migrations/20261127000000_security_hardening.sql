-- ============================================================================
-- Security hardening: RPC execute privileges and caller checks
-- ============================================================================
-- Postgres grants EXECUTE on new functions to PUBLIC, and Supabase's default
-- privileges additionally grant it to anon/authenticated/service_role. Several
-- early SECURITY DEFINER functions never had that narrowed, so the anon key
-- (which ships in every browser bundle) could call them through PostgREST.
--
-- Idempotent: only REVOKE/GRANT and CREATE OR REPLACE statements.

-- ----------------------------------------------------------------------------
-- create_organization(): require an authenticated caller.
-- Previously an anonymous call ran the INSERT into organizations and only
-- failed (and rolled back) when the memberships insert hit a NULL user_id.
-- Failing up-front with a clear error removes that dependency on an incidental
-- NOT NULL constraint. Body is otherwise identical to 20261125000000.
-- ----------------------------------------------------------------------------
create or replace function public.create_organization(org_name text, org_slug text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org public.organizations;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to create an organization'
      using errcode = '28000';
  end if;

  insert into public.organizations (name, slug, subscription_status, trial_ends_at)
  values (org_name, org_slug, 'trialing', now() + interval '14 days')
  returning * into new_org;

  insert into public.memberships (user_id, organization_id, role)
  values (auth.uid(), new_org.id, 'owner');

  return new_org;
end;
$$;

-- ----------------------------------------------------------------------------
-- Signed-in-only RPCs: not callable with the bare anon key.
-- ----------------------------------------------------------------------------
revoke all on function public.create_organization(text, text) from public;
revoke all on function public.create_organization(text, text) from anon;
grant execute on function public.create_organization(text, text) to authenticated, service_role;

revoke all on function public.accept_invitation(text) from public;
revoke all on function public.accept_invitation(text) from anon;
grant execute on function public.accept_invitation(text) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Trigger functions are invoked by the trigger machinery (privileges are
-- checked when the trigger is created, not when it fires), never as RPCs.
-- ----------------------------------------------------------------------------
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;

revoke all on function public.reset_agency_cname_status() from public;
revoke all on function public.reset_agency_cname_status() from anon, authenticated;
