-- ============================================================================
-- Nimbus SaaS — Anonymous RAG chat flow: SECURITY DEFINER RPCs
-- ----------------------------------------------------------------------------
-- Same rationale as `20261113000000_booking_anon_rpcs.sql`: `/api/chat/rag`
-- is anonymous and previously ran entirely on the service-role client. These
-- functions let it run on the anon key instead, with tenant scoping enforced
-- inside each function body rather than by TypeScript alone.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- get_chat_session_for_org
-- Confirms a session id actually belongs to the given organization before
-- any history is read or appended to it.
-- ----------------------------------------------------------------------------
create or replace function public.get_chat_session_for_org(
  p_organization_id uuid,
  p_session_id uuid
)
returns public.chat_sessions
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.chat_sessions
  where id = p_session_id
    and organization_id = p_organization_id;
$$;

revoke all on function public.get_chat_session_for_org(uuid, uuid) from public;
grant execute on function public.get_chat_session_for_org(uuid, uuid) to anon;

-- ----------------------------------------------------------------------------
-- create_chat_session
-- ----------------------------------------------------------------------------
create or replace function public.create_chat_session(
  p_organization_id uuid
)
returns public.chat_sessions
language sql
security definer
set search_path = public
as $$
  insert into public.chat_sessions (organization_id)
  values (p_organization_id)
  returning *;
$$;

revoke all on function public.create_chat_session(uuid) from public;
grant execute on function public.create_chat_session(uuid) to anon;

-- ----------------------------------------------------------------------------
-- get_chat_history
-- Returns a session's messages, scoped to its organization. Ordering/limit
-- is left to the caller (`.order()`/`.limit()` chained onto the `.rpc()`
-- call), since the widget's history reload and the prompt-builder's recent
-- context want different ordering/limits from the same underlying rows.
-- ----------------------------------------------------------------------------
create or replace function public.get_chat_history(
  p_organization_id uuid,
  p_session_id uuid
)
returns setof public.chat_messages
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.chat_messages
  where session_id = p_session_id
    and organization_id = p_organization_id;
$$;

revoke all on function public.get_chat_history(uuid, uuid) from public;
grant execute on function public.get_chat_history(uuid, uuid) to anon;

-- ----------------------------------------------------------------------------
-- insert_chat_message
-- Shared by the visitor's message and the assistant's reply.
-- ----------------------------------------------------------------------------
create or replace function public.insert_chat_message(
  p_organization_id uuid,
  p_session_id uuid,
  p_role text,
  p_content text,
  p_sources jsonb default null
)
returns public.chat_messages
language sql
security definer
set search_path = public
as $$
  insert into public.chat_messages (organization_id, session_id, role, content, sources)
  values (p_organization_id, p_session_id, p_role, p_content, p_sources)
  returning *;
$$;

revoke all on function public.insert_chat_message(uuid, uuid, text, text, jsonb) from public;
grant execute on function public.insert_chat_message(uuid, uuid, text, text, jsonb) to anon;

-- ----------------------------------------------------------------------------
-- match_document_chunks: flip to SECURITY DEFINER
-- Previously ran as invoker (see original comment in
-- `20261109000000_ai_rag_chatbot.sql`) specifically because the chat route
-- used the service-role client, which bypasses this distinction entirely.
-- Now that the route runs on the anon key, the function itself needs
-- elevated privilege — its own `match_organization_id` filter is what keeps
-- it tenant-scoped, exactly as `match_count`/`match_threshold` already
-- bound its other behavior.
-- ----------------------------------------------------------------------------
alter function public.match_document_chunks(extensions.vector, uuid, int, float)
  security definer
  set search_path = public, extensions;

revoke all on function public.match_document_chunks(extensions.vector, uuid, int, float) from public;
grant execute on function public.match_document_chunks(extensions.vector, uuid, int, float) to anon;
