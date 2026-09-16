-- ----------------------------------------------------------------------------
-- Admin CRM update (Pasargad brief §5.2): the lead pipeline becomes a
-- 5-stage flow — new -> contacted -> quoted -> accepted -> rejected —
-- replacing the old new/quoted/accepted/completed/rejected shape. There is
-- no "completed" lead status any more: once a lead is converted, project
-- completion is tracked on `client_projects.stage` ('live'), not here.
--
-- The existing check constraint is dropped by introspecting pg_constraint
-- instead of a hardcoded name, since Postgres's auto-generated name for an
-- unnamed column-level check isn't guaranteed and guessing wrong would
-- silently leave the old constraint active alongside the new one.
-- ----------------------------------------------------------------------------

-- Existing 'completed' leads have no equivalent stage in the new model —
-- 'accepted' is the closest fit (they were already past acceptance; actual
-- delivery state now lives on client_projects.stage).
update public.leads set status = 'accepted' where status = 'completed';

do $$
declare
  con record;
begin
  for con in
    select conname
    from pg_constraint
    where conrelid = 'public.leads'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.leads drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.leads
  add constraint leads_status_check
    check (status in ('new', 'contacted', 'quoted', 'accepted', 'rejected'));
