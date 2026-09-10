-- ============================================================================
-- Nimbus SaaS — Initial database schema
-- ----------------------------------------------------------------------------
-- Tables:        profiles, organizations, memberships
-- Enums:         membership_role
-- Functions:     set_updated_at, handle_new_user, is_org_member,
--                current_user_role, create_organization
-- Triggers:      profiles/organizations updated_at, on_auth_user_created
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type public.membership_role as enum ('owner', 'admin', 'member');

-- ----------------------------------------------------------------------------
-- PROFILES
-- One row per auth.users account; auto-created by the on_auth_user_created
-- trigger below.
-- ----------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ORGANIZATIONS
-- A tenant / workspace. `slug` is a unique, human-friendly identifier.
-- ----------------------------------------------------------------------------
create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- MEMBERSHIPS
-- Junction table linking a profile to an organization with a role.
-- ----------------------------------------------------------------------------
create table public.memberships (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role            public.membership_role not null default 'member',
  created_at      timestamptz not null default now(),
  unique (user_id, organization_id)
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
create index idx_profiles_email on public.profiles (email);
create index idx_memberships_user_id on public.memberships (user_id);
create index idx_memberships_organization_id on public.memberships (organization_id);
create index idx_organizations_slug on public.organizations (slug);

-- ----------------------------------------------------------------------------
-- HELPER: keep `updated_at` current on every update
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- HELPER: auto-create a profile whenever a new auth user signs up
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- HELPER: RLS-safe membership checks
-- SECURITY DEFINER + fixed search_path lets these bypass RLS so they can be
-- referenced from RLS policies without triggering recursive policy checks.
-- ----------------------------------------------------------------------------
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.memberships
    where organization_id = org_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.current_user_role(org_id uuid)
returns public.membership_role
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.memberships
  where organization_id = org_id
    and user_id = auth.uid()
  limit 1;
$$;

-- ----------------------------------------------------------------------------
-- HELPER: atomically create an organization and make the caller its owner
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
  insert into public.organizations (name, slug)
  values (org_name, org_slug)
  returning * into new_org;

  insert into public.memberships (user_id, organization_id, role)
  values (auth.uid(), new_org.id, 'owner');

  return new_org;
end;
$$;
