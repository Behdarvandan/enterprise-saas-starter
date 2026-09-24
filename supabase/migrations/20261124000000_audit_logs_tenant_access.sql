-- Adds tenant-member access to the existing public.audit_logs table
-- (20261114000005_audit_logs.sql), which was operator-admin-read-only /
-- service-role-write-only. Additive: existing policy, RPC, and grants
-- are untouched.

create policy "audit_logs_select_tenant_member"
  on public.audit_logs for select
  using (public.current_user_role(organization_id) is not null);

create policy "audit_logs_insert_tenant_member"
  on public.audit_logs for insert
  with check (public.current_user_role(organization_id) is not null);
