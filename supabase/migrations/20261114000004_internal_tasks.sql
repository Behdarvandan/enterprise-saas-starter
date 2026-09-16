-- ============================================================================
-- Nimbus SaaS — Internal micro-project Kanban board
-- ----------------------------------------------------------------------------
-- Tables:      internal_tasks
-- ----------------------------------------------------------------------------
-- The operator's own internal work items (infra chores, marketing tasks,
-- etc.) — deliberately separate from `client_projects`, which is
-- client-facing and readable by tenant members. `internal_tasks` has no
-- `organization_id` (it isn't tenant data at all) and is visible only to the
-- operator admin.
-- ============================================================================

create table public.internal_tasks (
  id                        uuid primary key default gen_random_uuid(),
  title                     text not null,
  description               text,
  column_status             text not null default 'todo'
                              check (column_status in ('todo', 'in_progress', 'review', 'done')),
  related_client_project_id uuid references public.client_projects (id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index idx_internal_tasks_column_status on public.internal_tasks (column_status);

create trigger trg_internal_tasks_updated_at
  before update on public.internal_tasks
  for each row execute procedure public.set_updated_at();

alter table public.internal_tasks enable row level security;

create policy "internal_tasks_all_operator_admin"
  on public.internal_tasks for all
  using (public.is_operator_admin())
  with check (public.is_operator_admin());
