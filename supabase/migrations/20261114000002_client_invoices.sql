-- ============================================================================
-- Nimbus SaaS — Client invoices (freelance billing)
-- ----------------------------------------------------------------------------
-- Tables:      client_invoices
-- ----------------------------------------------------------------------------
-- Same access shape as client_projects: tenant member reads their own
-- organization's invoices (for the client-portal PDF download screen), the
-- operator admin has full CRUD for the admin CRM/revenue analytics.
-- ============================================================================

create table public.client_invoices (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id      uuid references public.client_projects (id) on delete set null,
  invoice_number  text not null unique,
  amount          integer not null check (amount >= 0), -- minor currency units
  currency        text not null default 'usd',
  status          text not null default 'draft'
                    check (status in ('draft', 'sent', 'paid', 'overdue', 'void')),
  due_date        date,
  paid_at         timestamptz,
  contract_url    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_client_invoices_organization_status on public.client_invoices (organization_id, status);

create trigger trg_client_invoices_updated_at
  before update on public.client_invoices
  for each row execute procedure public.set_updated_at();

alter table public.client_invoices enable row level security;

create policy "client_invoices_select_member"
  on public.client_invoices for select
  using (public.is_org_member(organization_id));

create policy "client_invoices_all_operator_admin"
  on public.client_invoices for all
  using (public.is_operator_admin())
  with check (public.is_operator_admin());
