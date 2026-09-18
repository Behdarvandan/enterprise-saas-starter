-- ============================================================================
-- Pasargad Core bridge — tenant_configs + match_vectors
-- ----------------------------------------------------------------------------
-- pasargad-core (the FastAPI/LangGraph backend behind /api/chat/rag) expects
-- two things that were never actually migrated into this schema:
--   1. A `tenant_configs` table (`packages/graph/state.py::load_tenant_config`
--      queries `select=version,config&tenant_id=eq...&is_active=eq.true
--      &order=version.desc&limit=1`).
--   2. A `match_vectors` RPC (`packages/graph/nodes/ops.py::_retrieve` calls
--      it with `query_embedding`/`filter_tenant_id`/`match_count`
--      /`similarity_threshold`).
-- Rather than rename call sites in the already-working Python code, this adds
-- a real table plus a thin compatibility RPC that reuses the existing
-- `document_chunks` table and its `hnsw` index (see
-- 20261109000000_ai_rag_chatbot.sql) — same data, different parameter names.
-- Both are backend-only (service-role access via pasargad-core); RLS is
-- enabled with no policies so no anon/authenticated client can read them.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TENANT_CONFIGS
-- Versioned, tenant-scoped LangGraph runtime config (system prompt, RAG
-- params, enabled skills for tool binding). Only the latest active version
-- per tenant is read; older versions are kept for audit/rollback.
-- ----------------------------------------------------------------------------
create table public.tenant_configs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.organizations (id) on delete cascade,
  version     integer not null default 1,
  config      jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index idx_tenant_configs_lookup
  on public.tenant_configs (tenant_id, is_active, version desc);

alter table public.tenant_configs enable row level security;
-- No policies: only the service-role key (pasargad-core, webhook handlers)
-- may read/write this table; it carries system prompts and skill grants that
-- must never be client-readable.

-- ----------------------------------------------------------------------------
-- MATCH_VECTORS
-- Compatibility wrapper around match_document_chunks's exact query, exposed
-- under the RPC name/parameters pasargad-core already calls.
-- ----------------------------------------------------------------------------
create or replace function public.match_vectors(
  query_embedding vector(1536),
  filter_tenant_id uuid,
  match_count int default 5,
  similarity_threshold float default 0.6
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  similarity float
)
language sql
stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where dc.organization_id = filter_tenant_id
    and 1 - (dc.embedding <=> query_embedding) > similarity_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- ----------------------------------------------------------------------------
-- SEED: demo tenant runtime config
-- Matches the "Repair Shop Demo" org from supabase/seed-repair-shop-demo.sql.
-- similarity_threshold 0.5 (not the RPC's 0.6 default) per Phase 2 spec.
-- ----------------------------------------------------------------------------
insert into public.tenant_configs (tenant_id, version, config, is_active)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  1,
  '{
    "system_prompt": "You are the AI assistant for Repair Shop Demo, a device repair shop. Answer visitor questions using only the retrieved knowledge base context. Be concise and friendly.",
    "rag_params": {"similarity_threshold": 0.5, "top_k": 5},
    "crew_config": {"enabled_skills": ["rag_search"]}
  }'::jsonb,
  true
)
on conflict do nothing;
