-- ============================================================================
-- Nimbus SaaS — AI Chatbot & RAG Knowledge Assistant
-- ----------------------------------------------------------------------------
-- Enables pgvector, adds the knowledge-base and chat tables with strict
-- multi-tenant Row Level Security, and exposes a cosine-similarity search RPC
-- (`match_document_chunks`) that always filters by `organization_id`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- VECTOR EXTENSION
-- ----------------------------------------------------------------------------
create extension if not exists vector with schema extensions;

-- ----------------------------------------------------------------------------
-- DOCUMENTS
-- A knowledge-base entry scoped to a single tenant.
-- ----------------------------------------------------------------------------
create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title           text not null,
  source_type     text not null default 'text'
                  check (source_type in ('text', 'file', 'url')),
  content         text not null,
  mime_type       text,
  byte_size       integer,
  status          text not null default 'processing'
                  check (status in ('processing', 'ready', 'failed')),
  metadata        jsonb not null default '{}'::jsonb,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- DOCUMENT_CHUNKS
-- Split-and-embedded fragments of a document. `embedding` uses 1536 dimensions
-- (OpenAI text-embedding-3-small).
-- ----------------------------------------------------------------------------
create table public.document_chunks (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id     uuid not null references public.documents (id) on delete cascade,
  chunk_index     integer not null,
  content         text not null,
  token_count     integer,
  embedding       vector(1536) not null,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  unique (document_id, chunk_index)
);

-- ----------------------------------------------------------------------------
-- CHAT_SESSIONS
-- One conversation per visitor, scoped to a tenant. `visitor_id` is an
-- optional anonymous identifier supplied by the embeddable widget.
-- ----------------------------------------------------------------------------
create table public.chat_sessions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  visitor_id      text,
  title           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- CHAT_MESSAGES
-- Individual turns within a session. `sources` holds optional citations from
-- matched knowledge chunks for assistant messages.
-- ----------------------------------------------------------------------------
create table public.chat_messages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  session_id      uuid not null references public.chat_sessions (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system')),
  content         text not null,
  sources         jsonb,
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
create index idx_documents_organization_id on public.documents (organization_id);
create index idx_documents_created_by on public.documents (created_by);

create index idx_document_chunks_organization_id on public.document_chunks (organization_id);
create index idx_document_chunks_document_id on public.document_chunks (document_id);

-- Approximate-nearest-neighbour index for fast cosine-similarity search.
create index idx_document_chunks_embedding
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops);

create index idx_chat_sessions_organization_id on public.chat_sessions (organization_id);
create index idx_chat_sessions_visitor_id on public.chat_sessions (visitor_id);

create index idx_chat_messages_organization_id on public.chat_messages (organization_id);
create index idx_chat_messages_session_id on public.chat_messages (session_id);

-- ----------------------------------------------------------------------------
-- HELPERS: keep `updated_at` current
-- ----------------------------------------------------------------------------
create trigger trg_documents_updated_at
  before update on public.documents
  for each row execute procedure public.set_updated_at();

create trigger trg_chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Every policy is scoped to the caller's membership via `is_org_member`.
-- ----------------------------------------------------------------------------
alter table public.documents enable row level security;
create policy "documents_select_member"
  on public.documents for select
  using (public.is_org_member(organization_id));
create policy "documents_insert_member"
  on public.documents for insert
  with check (public.is_org_member(organization_id));
create policy "documents_update_member"
  on public.documents for update
  using (public.is_org_member(organization_id));
create policy "documents_delete_member"
  on public.documents for delete
  using (public.is_org_member(organization_id));

alter table public.document_chunks enable row level security;
create policy "document_chunks_select_member"
  on public.document_chunks for select
  using (public.is_org_member(organization_id));
create policy "document_chunks_insert_member"
  on public.document_chunks for insert
  with check (public.is_org_member(organization_id));
create policy "document_chunks_update_member"
  on public.document_chunks for update
  using (public.is_org_member(organization_id));
create policy "document_chunks_delete_member"
  on public.document_chunks for delete
  using (public.is_org_member(organization_id));

alter table public.chat_sessions enable row level security;
create policy "chat_sessions_select_member"
  on public.chat_sessions for select
  using (public.is_org_member(organization_id));
create policy "chat_sessions_insert_member"
  on public.chat_sessions for insert
  with check (public.is_org_member(organization_id));
create policy "chat_sessions_update_member"
  on public.chat_sessions for update
  using (public.is_org_member(organization_id));
create policy "chat_sessions_delete_member"
  on public.chat_sessions for delete
  using (public.is_org_member(organization_id));

alter table public.chat_messages enable row level security;
create policy "chat_messages_select_member"
  on public.chat_messages for select
  using (public.is_org_member(organization_id));
create policy "chat_messages_insert_member"
  on public.chat_messages for insert
  with check (public.is_org_member(organization_id));
create policy "chat_messages_update_member"
  on public.chat_messages for update
  using (public.is_org_member(organization_id));
create policy "chat_messages_delete_member"
  on public.chat_messages for delete
  using (public.is_org_member(organization_id));

-- ----------------------------------------------------------------------------
-- SIMILARITY SEARCH RPC
-- Cosine-similarity search over a tenant's chunks. The `organization_id`
-- filter is applied before the similarity threshold so tenants can never see
-- each other's vectors. Runs as invoker so authenticated callers remain
-- protected by RLS; the chat route uses the service-role client.
-- ----------------------------------------------------------------------------
create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_organization_id uuid,
  match_count int default 5,
  match_threshold float default 0.5
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
  where dc.organization_id = match_organization_id
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

