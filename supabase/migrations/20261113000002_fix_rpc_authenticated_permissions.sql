-- ============================================================================
-- Nimbus SaaS — Restrict anonymous-flow RPCs to the anon role only
-- ----------------------------------------------------------------------------
-- `20261113000000_booking_anon_rpcs.sql` and `..._chat_anon_rpcs.sql` each
-- ran `revoke all ... from public;` before granting `execute` to `anon`,
-- intending these `SECURITY DEFINER` functions to be anon-only. That revoke
-- only removes the PUBLIC pseudo-role's grant — Supabase's project-level
-- default privileges separately grant `EXECUTE` on every new `public`
-- schema function directly to `anon`, `authenticated`, and `service_role`
-- at creation time, regardless of that revoke.
--
-- Net effect: any logged-in (`authenticated`) user could call these
-- functions with an arbitrary `organization_id` parameter — none of them
-- check `is_org_member`, since that check is meaningless for the anonymous
-- callers they were designed for. An authenticated member of one
-- organization could read or write another organization's booking/chat
-- data through this path. This migration closes that by explicitly
-- revoking `EXECUTE` from `authenticated` on each function, leaving `anon`
-- (needed) and `service_role` (bypasses grants regardless) untouched.
-- ============================================================================

-- Booking RPCs
revoke execute on function public.get_bookable_service(uuid, uuid) from authenticated;
revoke execute on function public.get_availability_windows(uuid, int) from authenticated;
revoke execute on function public.get_appointment_conflicts(uuid, timestamptz, timestamptz) from authenticated;
revoke execute on function public.create_pending_appointment(uuid, uuid, text, text, text, text, text, timestamptz) from authenticated;
revoke execute on function public.get_appointment_details(uuid, uuid) from authenticated;
revoke execute on function public.is_organization_serviceable(uuid) from authenticated;
revoke execute on function public.get_organization_booking_info(uuid) from authenticated;
revoke execute on function public.confirm_pending_appointment(uuid, uuid) from authenticated;

-- Chat RPCs
revoke execute on function public.get_chat_session_for_org(uuid, uuid) from authenticated;
revoke execute on function public.create_chat_session(uuid) from authenticated;
revoke execute on function public.get_chat_history(uuid, uuid) from authenticated;
revoke execute on function public.insert_chat_message(uuid, uuid, text, text, jsonb) from authenticated;
revoke execute on function public.match_document_chunks(extensions.vector, uuid, int, float) from authenticated;
