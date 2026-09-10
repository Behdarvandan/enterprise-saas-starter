-- ============================================================================
-- Nimbus SaaS — Row Level Security (RLS) policies
-- ============================================================================

-- PROFILES --------------------------------------------------------------
alter table public.profiles enable row level security;

-- Users can only read their own profile.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can only update their own profile.
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ORGANIZATIONS ---------------------------------------------------------
alter table public.organizations enable row level security;

-- Members can view organizations they belong to.
create policy "organizations_select_member"
  on public.organizations for select
  using (public.is_org_member(id));

-- Only owners/admins can update an organization.
create policy "organizations_update_admin"
  on public.organizations for update
  using (public.current_user_role(id) in ('owner', 'admin'));

-- MEMBERSHIPS -----------------------------------------------------------
alter table public.memberships enable row level security;

-- Users can see their own membership plus those of organizations they belong to.
create policy "memberships_select_member"
  on public.memberships for select
  using (user_id = auth.uid() or public.is_org_member(organization_id));

-- Only owners/admins can add members to their organization.
create policy "memberships_insert_admin"
  on public.memberships for insert
  with check (public.current_user_role(organization_id) in ('owner', 'admin'));

-- Only owners/admins can update a membership in their organization.
create policy "memberships_update_admin"
  on public.memberships for update
  using (public.current_user_role(organization_id) in ('owner', 'admin'));

-- Only owners/admins can remove a membership in their organization.
create policy "memberships_delete_admin"
  on public.memberships for delete
  using (public.current_user_role(organization_id) in ('owner', 'admin'));
