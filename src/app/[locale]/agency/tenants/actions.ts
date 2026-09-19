"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyAdminResult } from "@/lib/agency/admin";
import { logAgencyAudit } from "@/lib/agency/audit";
import { getAgencyTranslators } from "@/lib/agency/messages";
import { isKnownAgencyRpcError, mapAgencyRpcError } from "@/lib/agency/rpc-errors";
import {
  quotaTotalSchema,
  skillListSchema,
  tenantIdSchema,
  tenantNameSchema,
  tenantSlugSchema,
} from "@/lib/agency/schemas";
import { findDisallowedSkills, getAllowedAgencySkills } from "@/lib/agency/skills";
import { applyTenantEnabledSkills } from "@/lib/payment/handlers";
import { DEFAULT_ENABLED_SKILLS } from "@/lib/skills-catalog";
import { firstIssueMessage } from "@/lib/validation";

export type AgencyActionResult = { error?: string; success?: boolean };

const TENANTS_PATH = "/agency/tenants";

/**
 * Every action below re-resolves the caller's agency through
 * `requireAgencyAdminResult()` and passes *that* agency id to the RPC, never
 * one supplied by the client. Postgres re-checks `is_agency_admin()` inside
 * each RPC, so a tampered request cannot act on someone else's agency.
 */

type Translators = Awaited<ReturnType<typeof getAgencyTranslators>>;

/** Logs unexpected RPC failures (known, user-facing errors are expected noise). */
function rpcFailure(tr: Translators, label: string, error: { message?: string }): AgencyActionResult {
  if (!isKnownAgencyRpcError(error)) console.error(`${label}:`, error);
  return { error: tr.error(mapAgencyRpcError(error)) };
}

export async function linkTenant(formData: FormData): Promise<AgencyActionResult> {
  const tr = await getAgencyTranslators();
  const auth = await requireAgencyAdminResult();
  if ("error" in auth) return auth;
  const { supabase, user, agency } = auth;

  const organizationId = tenantIdSchema.safeParse(formData.get("organizationId"));
  if (!organizationId.success) {
    return { error: tr.validation(firstIssueMessage(organizationId.error)) };
  }

  // Resolved under the caller's own RLS: only organizations they are a member
  // of are visible, so an unknown id and someone else's organization are
  // indistinguishable (no probing for which organizations exist). Ownership
  // itself is enforced by the RPC.
  const { data: organization } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", organizationId.data)
    .maybeSingle();
  if (!organization) return { error: tr.error("org_not_found") };

  const { error } = await supabase.rpc("link_agency_tenant", {
    p_agency_id: agency.id,
    p_tenant_id: organization.id,
  });
  if (error) return rpcFailure(tr, "linkTenant", error);

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
  const tr = await getAgencyTranslators();
  const auth = await requireAgencyAdminResult();
  if ("error" in auth) return auth;
  const { supabase, user, agency } = auth;

  const name = tenantNameSchema.safeParse(formData.get("name"));
  if (!name.success) return { error: tr.validation(firstIssueMessage(name.error)) };
  const slug = tenantSlugSchema.safeParse(formData.get("slug"));
  if (!slug.success) return { error: tr.validation(firstIssueMessage(slug.error)) };

  const { data: tenantId, error } = await supabase.rpc("create_agency_tenant", {
    p_agency_id: agency.id,
    p_name: name.data,
    p_slug: slug.data,
  });
  if (error || !tenantId) return rpcFailure(tr, "createTenant", error ?? {});

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
  const tr = await getAgencyTranslators();
  const auth = await requireAgencyAdminResult();
  if ("error" in auth) return auth;
  const { supabase, user, agency } = auth;

  const id = tenantIdSchema.safeParse(tenantId);
  if (!id.success) return { error: tr.validation(firstIssueMessage(id.error)) };

  const { error } = await supabase.rpc("unlink_agency_tenant", {
    p_agency_id: agency.id,
    p_tenant_id: id.data,
  });
  if (error) return rpcFailure(tr, "unlinkTenant", error);

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
  const tr = await getAgencyTranslators();
  const auth = await requireAgencyAdminResult();
  if ("error" in auth) return auth;
  const { supabase, user, agency } = auth;

  const id = tenantIdSchema.safeParse(tenantId);
  if (!id.success) return { error: tr.validation(firstIssueMessage(id.error)) };
  const amount = quotaTotalSchema.safeParse(total);
  if (!amount.success) return { error: tr.validation(firstIssueMessage(amount.error)) };

  const { error } = await supabase.rpc("allocate_agency_tenant_quota", {
    p_agency_id: agency.id,
    p_tenant_id: id.data,
    p_total: amount.data,
  });
  if (error) return rpcFailure(tr, "allocateQuota", error);

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
  const tr = await getAgencyTranslators();
  const auth = await requireAgencyAdminResult();
  if ("error" in auth) return auth;
  const { supabase, user, agency } = auth;

  const id = tenantIdSchema.safeParse(tenantId);
  if (!id.success) return { error: tr.validation(firstIssueMessage(id.error)) };
  const parsedSkills = skillListSchema.safeParse(skills);
  if (!parsedSkills.success) return { error: tr.error("invalid_skills") };

  // Ownership check under RLS: rows outside the caller's agency are invisible.
  const { data: link, error: linkError } = await supabase
    .from("agency_tenants")
    .select("tenant_id")
    .eq("agency_id", agency.id)
    .eq("tenant_id", id.data)
    .maybeSingle();
  if (linkError) {
    console.error("updateTenantSkills: tenant lookup failed:", linkError);
    return { error: tr.error("generic") };
  }
  if (!link) return { error: tr.error("tenant_not_in_agency") };

  const allowed = await getAllowedAgencySkills(supabase, agency);
  const disallowed = findDisallowedSkills(parsedSkills.data, allowed);
  if (disallowed.length > 0) {
    return { error: tr.error("plan_limit", { skills: disallowed.join(", ") }) };
  }

  const { error } = await applyTenantEnabledSkills(id.data, parsedSkills.data);
  if (error) return { error: tr.error("generic") };

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
