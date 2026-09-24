-- ============================================================================
-- Auto tenant provisioning — 14-day trial on signup
-- ----------------------------------------------------------------------------
-- Adds organizations.trial_ends_at and extends the existing auth.users
-- trigger (handle_new_user) to auto-create an organization + owner
-- membership for every new signup, granting a 14-day trial. Also updates
-- create_organization() (used by ensureOrganization()'s lazy-provisioning
-- fallback) for the same trial parity, so every org-creation path grants the
-- same 14 free days.
-- ============================================================================

alter table public.organizations
  add column if not exists trial_ends_at timestamptz;

-- ----------------------------------------------------------------------------
-- Extend handle_new_user(): after creating the profile, also create a default
-- organization (name/slug derived from the email, mirroring
-- src/lib/billing.ts's ensureOrganization()) and make the new user its owner,
-- with subscription_status = 'trialing' and a 14-day trial_ends_at.
--
-- auth.uid() is not populated inside an AFTER INSERT ON auth.users trigger,
-- so new.id is used in place of it (unlike create_organization(), which runs
-- in an authenticated RPC context).
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  local_part text := coalesce(nullif(split_part(new.email, '@', 1), ''), 'user');
  org_name   text := local_part || '''s Workspace';
  org_slug   text := lower(local_part || '-' || substr(new.id::text, 1, 8));
  new_org_id uuid;
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.organizations (name, slug, subscription_status, trial_ends_at)
  values (org_name, org_slug, 'trialing', now() + interval '14 days')
  returning id into new_org_id;

  insert into public.memberships (user_id, organization_id, role)
  values (new.id, new_org_id, 'owner');

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- create_organization(): same 14-day trial default, so the lazy-provisioning
-- fallback (ensureOrganization(), used e.g. by pre-migration accounts) grants
-- the same trial as the trigger above.
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
  insert into public.organizations (name, slug, subscription_status, trial_ends_at)
  values (org_name, org_slug, 'trialing', now() + interval '14 days')
  returning * into new_org;

  insert into public.memberships (user_id, organization_id, role)
  values (auth.uid(), new_org.id, 'owner');

  return new_org;
end;
$$;
