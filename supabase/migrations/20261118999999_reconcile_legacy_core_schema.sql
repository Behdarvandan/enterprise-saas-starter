-- ============================================================================
-- Pasargad production launch — reconcile the live database's legacy core schema
-- ----------------------------------------------------------------------------
-- The live project was first provisioned from pasargad-core's original
-- (Phase 1) schema, applied by hand, before the migration history started
-- tracking it. Two objects from that era collide with, or undermine, the
-- migrations that follow (20261119 + Phase 4):
--
--   1. public.tenant_configs — legacy shape (system_prompt, allowed_tools,
--      rag_k_value, ...). 20261119 does a plain `create table
--      public.tenant_configs` with the shape pasargad-core actually reads
--      (version, config, is_active), which would fail with "already exists".
--      The legacy table also carries GRANT ALL to anon/authenticated and a
--      permissive policy, contrary to the intent of a service-role-only table.
--
--   2. public.match_vectors(vector, double precision, integer, uuid) — a
--      SECURITY DEFINER function whose tenant filter is OPTIONAL
--      (`filter_tenant_id DEFAULT NULL`) and that anon can EXECUTE. Called
--      without the filter it returns every tenant's document chunks. Only
--      the bridge's tenant-scoped match_vectors (20261119) may remain.
--
-- This file sorts after the last applied migration (20261118) and before
-- 20261119, so `supabase db push` runs it first. It is guarded: on a database
-- that never had the legacy objects (fresh installs, local stacks) it does
-- nothing.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Move the legacy tenant_configs out of the way (data preserved).
-- ----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  if to_regclass('public.tenant_configs') is null then
    return;
  end if;

  -- Legacy shape = has `rag_k_value`, lacks the `config` jsonb column.
  if not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'tenant_configs'
         and column_name = 'rag_k_value'
     )
     or exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'tenant_configs'
         and column_name = 'config'
     )
  then
    return;
  end if;

  alter table public.tenant_configs rename to tenant_configs_legacy;

  -- Constraint names (and the index behind the primary key) are still
  -- `tenant_configs_*`; rename them so the new table can reuse those names.
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.tenant_configs_legacy'::regclass
      and c.conname like 'tenant\_configs\_%'
  loop
    execute format(
      'alter table public.tenant_configs_legacy rename constraint %I to %I',
      r.conname,
      replace(r.conname, 'tenant_configs_', 'tenant_configs_legacy_')
    );
  end loop;

  -- No client-side access to the legacy rows: drop every policy and grant.
  for r in
    select p.policyname
    from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'tenant_configs_legacy'
  loop
    execute format('drop policy %I on public.tenant_configs_legacy', r.policyname);
  end loop;

  revoke all on table public.tenant_configs_legacy from anon, authenticated;

  comment on table public.tenant_configs_legacy is
    'Legacy (Phase 1) tenant_configs, superseded by tenant_configs (20261119). '
    'Kept only for reference; safe to drop once the new table is verified.';
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Drop the legacy, tenant-filter-optional match_vectors overload.
-- Identified by its `match_threshold` parameter (the bridge's version uses
-- `similarity_threshold`), and resolved through pg_proc so the drop does not
-- depend on which schema the `vector` type lives in.
-- ----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'match_vectors'
      and p.proargnames @> array['match_threshold']::text[]
  loop
    execute format('drop function %s', r.signature);
  end loop;
end;
$$;
