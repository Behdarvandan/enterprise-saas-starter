-- ============================================================================
-- Nimbus SaaS — Team invitations & membership acceptance
-- ----------------------------------------------------------------------------
-- Adds an `invitations` table for inviting users to an organization, RLS
-- policies that restrict management to owners/admins, and a SECURITY DEFINER
-- function that lets an invited user atomically accept an invitation.
-- ============================================================================

create table public.invitations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email           text not null,
  role            public.membership_role not null default 'member',
  token           text not null unique,
  expires_at      timestamptz not null,
  status          text not null default 'pending'
                  check (status in ('pending', 'accepted', 'revoked')),
  created_at      timestamptz not null default now()
);

create index idx_invitations_organization_id on public.invitations (organization_id);
create index idx_invitations_email on public.invitations (email);
create index idx_invitations_token on public.invitations (token);

-- At most one pending invitation per organization + email.
create unique index idx_invitations_org_email_pending
  on public.invitations (organization_id, email)
  where status = 'pending';

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.invitations enable row level security;

-- Any member can view their organization's invitations.
create policy "invitations_select_member"
  on public.invitations for select
  using (public.is_org_member(organization_id));

-- Only owners/admins can create invitations.
create policy "invitations_insert_admin"
  on public.invitations for insert
  with check (public.current_user_role(organization_id) in ('owner', 'admin'));

-- Only owners/admins can update (e.g. revoke) invitations.
create policy "invitations_update_admin"
  on public.invitations for update
  using (public.current_user_role(organization_id) in ('owner', 'admin'));

-- Only owners/admins can delete invitations.
create policy "invitations_delete_admin"
  on public.invitations for delete
  using (public.current_user_role(organization_id) in ('owner', 'admin'));

-- ----------------------------------------------------------------------------
-- ACCEPT INVITATION
-- SECURITY DEFINER so an invited (not-yet-member) user can join. Validates the
-- token, checks status/expiry, adds the membership, and marks it accepted.
-- ----------------------------------------------------------------------------
create or replace function public.accept_invitation(p_token text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.invitations;
  v_user_id uuid := auth.uid();
  v_org public.organizations;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to accept an invitation';
  end if;

  select * into v_invitation
  from public.invitations
  where token = p_token
  for update;

  if v_invitation is null then
    raise exception 'Invitation not found';
  end if;

  if v_invitation.status <> 'pending' then
    raise exception 'This invitation is no longer valid';
  end if;

  if v_invitation.expires_at < now() then
    raise exception 'This invitation has expired';
  end if;

  insert into public.memberships (user_id, organization_id, role)
  values (v_user_id, v_invitation.organization_id, v_invitation.role)
  on conflict (user_id, organization_id) do nothing;

  update public.invitations
  set status = 'accepted'
  where id = v_invitation.id;

  select * into v_org
  from public.organizations
  where id = v_invitation.organization_id;

  return v_org;
end;
$$;
