-- ============================================================================
-- Nimbus SaaS — Chat Messages Composite Index
-- ----------------------------------------------------------------------------
-- The RAG chat history hot path in `src/app/api/chat/rag/route.ts` always
-- filters `chat_messages` by both `session_id` and `organization_id` and then
-- orders the result by `created_at`:
--
--     .from("chat_messages")
--       .eq("session_id", ...)
--       .eq("organization_id", ...)
--       .order("created_at")
--
-- A single composite index over (session_id, organization_id, created_at)
-- serves that query — including its sort — far better than the two separate
-- single-column indexes (`idx_chat_messages_organization_id`,
-- `idx_chat_messages_session_id`), which each cover only half of the predicate
-- and leave the other half plus the `order by` unindexed. No other query in
-- the codebase filters `chat_messages` by a single column, so the single-column
-- indexes are superseded and dropped here.
-- ============================================================================

drop index if exists idx_chat_messages_organization_id;
drop index if exists idx_chat_messages_session_id;

create index idx_chat_messages_session_org_created
  on public.chat_messages (session_id, organization_id, created_at);
