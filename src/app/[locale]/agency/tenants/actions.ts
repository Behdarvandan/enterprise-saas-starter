"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyAdminResult } from "@/lib/agency/admin";
import { logAgencyAudit } from "@/lib/agency/audit";
import { GENERIC_AGENCY_ERROR, isKnownAgencyRpcError, mapAgencyRpcError } from "@/lib/agency/rpc-errors";
import {
  quotaTotalSchema,
  skillListSchema,
  tenantIdSchema,
  tenantNameSchema,
  tenantSlugSchema,
} from "@/lib/agency/schemas";
import { findDisallowedSkills, getAllowedAgencySkills } from "@/lib/agency/skills";
import { applyTenantEnabledSkills, DEFAULT_ENABLED_SKILLS } from "@/lib/payment/handlers";
import { firstIssueMessage } from "@/lib/validation";

export type AgencyActionResult = { error?: string; success?: boolean };

const TENANTS_PATH = "/agency/tenants";

/**
 * Every action below re-resolves the caller's agency through
 * `requireAgencyAdminResult()` and passes *that* agency id to the RPC, never
 * one supplied by the client. Postgres re-checks `is_agency_admin()` inside
 * each RPC, so a tampered request cannot act on someone else's agency.
 */

/** Logs unexpected RPC failures (known, user-facing errors are expected noise). */
function rpcFailure(label: string, error: { message?: string }): AgencyActionResult {
  if (!isKnownAgencyRpcError(error)) console.error(`${label}:`, error);
  return { error: mapAgencyRpcError(error) };
}

export async function linkTenant(formData: FormData): Promise<AgencyActionResult> {
  const auth = await requireAgencyAdminResult();
  if ("error" in auth) return auth;
  const { supabase, user, agency } = auth;

  const slug = tenantSlugSchema.safeParse(formData.get("slug"));
  if (!slug.success) return { error: firstIssueMessage(slug.error) };

  // Resolved under the caller's own RLS: only organizations they are a member
  // of are visible, so an unknown slug and someone else's organization are
  // indistinguishable (no probing for which slugs exist).
  const { data: organization } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug.data)
    .maybeSingle();
  if (!organization) {
    return { error: "No organization with that slug was found among the ones you own." };
  }

  const { error } = await supabase.rpc("link_agency_tenant", {
    p_agency_id: agency.id,
    p_tenant_id: organization.id,
  });
  if (error) return rpcFailure("linkTenant", error);

  await logAgencyAudit({
    action: "agency.tenant_linked",
    agencyMasterTenantId: agency.master_tenant_id,
    actorId: user.id,
    targetTable: "agency_tenants",
    targetId: organization.id,
  });

  revalidatePath(TENANTS_PATH);
  return { success: true };
}

export async function createTenant(formData: FormData): Promise<AgencyActionResult> {
  const auth = await requireAgencyAdminResult();
  if ("error" in auth) return auth;
  const { supabase, user, agency } = auth;

  const name = tenantNameSchema.safeParse(formData.get("name"));
  if (!name.success) return { error: firstIssueMessage(name.error) };
  const slug = tenantSlugSchema.safeParse(formData.get("slug"));
  if (!slug.success) return { error: firstIssueMessage(slug.error) };

  const { data: tenantId, error } = await supabase.rpc("create_agency_tenant", {
    p_agency_id: agency.id,
    p_name: name.data,
    p_slug: slug.data,
  });
  if (error || !tenantId) return rpcFailure("createTenant", error ?? {});

  // A brand-new tenant needs an active tenant_configs row or pasargad-core
  // answers its chats with a 404. Best-effort: the tenant exists either way,
  // and the skills dialog can write the config later.
  const { error: configError } = await applyTenantEnabledSkills(tenantId, DEFAULT_ENABLED_SKILLS);
  if (configError) console.error("createTenant: could not seed tenant_configs:", configError);

  await logAgencyAudit({
    action: "agency.tenant_created",
    agencyMasterTenantId: agency.master_tenant_id,
    actorId: user.id,
    targetTable: "agency_tenants",
    targetId: tenantId,
    metadata: { slug: slug.data },
  });

  revalidatePath(TENANTS_PATH);
  return { success: true };
}

export async function unlinkTenant(tenantId: string): Promise<AgencyActionResult> {
  const auth = await requireAgencyAdminResult();
  if ("error" in auth) return auth;
  const { supabase, user, agency } = auth;

  const id = tenantIdSchema.safeParse(tenantId);
  if (!id.success) return { error: firstIssueMessage(id.error) };

  const { error } = await supabase.rpc("unlink_agency_tenant", {
    p_agency_id: agency.id,
    p_tenant_id: id.data,
  });
  if (error) return rpcFailure("unlinkTenant", error);

  await logAgencyAudit({
    action: "agency.tenant_unlinked",
    agencyMasterTenantId: agency.master_tenant_id,
    actorId: user.id,
    targetTable: "agency_tenants",
    targetId: id.data,
  });

  revalidatePath(TENANTS_PATH);
  return { success: true };
}

/** Sets a tenant's total token budget for the current period (see allocate_agency_tenant_quota). */
export async function allocateQuota(
  tenantId: string,
  total: string,
): Promise<AgencyActionResult> {
  const auth = await requireAgencyAdminResult();
  if ("error" in auth) return auth;
  const { supabase, user, agency } = auth;

  const id = tenantIdSchema.safeParse(tenantId);
  if (!id.success) return { error: firstIssueMessage(id.error) };
  const amount = quotaTotalSchema.safeParse(total);
  if (!amount.success) return { error: firstIssueMessage(amount.error) };

  const { error } = await supabase.rpc("allocate_agency_tenant_quota", {
    p_agency_id: agency.id,
    p_tenant_id: id.data,
    p_total: amount.data,
  });
  if (error) return rpcFailure("allocateQuota", error);

  await logAgencyAudit({
    action: "agency.quota_allocated",
    agencyMasterTenantId: agency.master_tenant_id,
    actorId: user.id,
    targetTable: "agency_tenants",
    targetId: id.data,
    metadata: { total: amount.data },
  });

  revalidatePath(TENANTS_PATH);
  return { success: true };
}

/**
 * Sets a tenant's active Ops Crew skills. The tenant must belong to the
 * caller's agency, and the skills are clamped to what the *agency's* plan
 * unlocks (`getAllowedAgencySkills`). `tenant_configs` is service-role only,
 * so the write goes through `applyTenantEnabledSkills`.
 */
export async function updateTenantSkills(
  tenantId: string,
  skills: string[],
): Promise<AgencyActionResult> {
  const auth = await requireAgencyAdminResult();
  if ("error" in auth) return auth;
  const { supabase, user, agency } = auth;

  const id = tenantIdSchema.safeParse(tenantId);
  if (!id.success) return { error: firstIssueMessage(id.error) };
  const parsedSkills = skillListSchema.safeParse(skills);
  if (!parsedSkills.success) return { error: "Invalid skill selection." };

  // Ownership check under RLS: rows outside the caller's agency are invisible.
  const { data: link, error: linkError } = await supabase
    .from("agency_tenants")
    .select("tenant_id")
    .eq("agency_id", agency.id)
    .eq("tenant_id", id.data)
    .maybeSingle();
  if (linkError) {
    console.error("updateTenantSkills: tenant lookup failed:", linkError);
    return { error: GENERIC_AGENCY_ERROR };
  }
  if (!link) return { error: mapAgencyRpcError({ message: "tenant_not_in_agency" }) };

  const allowed = await getAllowedAgencySkills(supabase, agency);
  const disallowed = findDisallowedSkills(parsedSkills.data, allowed);
  if (disallowed.length > 0) {
    return { error: `Your agency plan doesn't include: ${disallowed.join(", ")}.` };
  }

  const { error } = await applyTenantEnabledSkills(id.data, parsedSkills.data);
  if (error) return { error: GENERIC_AGENCY_ERROR };

  await logAgencyAudit({
    action: "agency.tenant_skills_updated",
    agencyMasterTenantId: agency.master_tenant_id,
    actorId: user.id,
    targetTable: "tenant_configs",
    targetId: id.data,
    metadata: { skills: parsedSkills.data },
  });

  revalidatePath(TENANTS_PATH);
  return { success: true };
}
