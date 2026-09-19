"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyAdminResult } from "@/lib/agency/admin";
import { logAgencyAudit } from "@/lib/agency/audit";
import { invalidateAgencyDomainCache } from "@/lib/agency/cname";
import { brandingFormSchema } from "@/lib/agency/schemas";
import { getAgencyTranslators } from "@/lib/agency/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types";

export type BrandingField = "title" | "logo_url" | "primary_color" | "cname_domain";

export type BrandingActionResult = {
  error?: string;
  /** Per-field messages, rendered under the matching input. */
  fieldErrors?: Partial<Record<BrandingField, string>>;
  success?: boolean;
  /** True when the saved domain differs from before, i.e. it needs (re)verification. */
  domainChanged?: boolean;
};

const BRANDING_KEYS = ["title", "logo_url", "primary_color"] as const;
const BRANDING_FIELDS: readonly string[] = [...BRANDING_KEYS, "cname_domain"];
const UNIQUE_VIOLATION = "23505";

function isBrandingField(value: unknown): value is BrandingField {
  return typeof value === "string" && BRANDING_FIELDS.includes(value);
}

function asJsonObject(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

/**
 * Saves the agency's white-label settings: `branding` (title / logo /
 * primary color) and `cname_domain`.
 *
 * `agencies` has no agency-admin write policy (only the operator writes), so
 * after the caller's agency is resolved through `is_agency_admin()` the write
 * uses the service-role client, limited to those two columns and pinned to
 * that agency's id. Unknown keys already stored in `branding` are preserved.
 * Changing the domain resets its verification status (DB trigger), so the
 * domain is never served white-labelled until it is verified again.
 */
export async function updateAgencyBranding(
  formData: FormData,
): Promise<BrandingActionResult> {
  const tr = await getAgencyTranslators();
  const auth = await requireAgencyAdminResult();
  if ("error" in auth) return auth;
  const { user, agency } = auth;

  const parsed = brandingFormSchema.safeParse({
    title: formData.get("title"),
    logo_url: formData.get("logo_url"),
    primary_color: formData.get("primary_color"),
    cname_domain: formData.get("cname_domain"),
  });
  if (!parsed.success) {
    const fieldErrors: BrandingActionResult["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (isBrandingField(field) && !fieldErrors[field]) fieldErrors[field] = tr.validation(issue.message);
    }
    return { error: tr.error("form_invalid"), fieldErrors };
  }

  const next = asJsonObject(agency.branding);
  for (const key of BRANDING_KEYS) {
    const value = parsed.data[key];
    if (value === undefined) delete next[key];
    else next[key] = value;
  }

  const newDomain = parsed.data.cname_domain ?? null;
  const domainChanged = newDomain !== agency.cname_domain;

  const admin = createAdminClient();
  const { error } = await admin
    .from("agencies")
    .update({
      branding: next as Json,
      ...(domainChanged ? { cname_domain: newDomain } : {}),
    })
    .eq("id", agency.id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return {
        error: tr.error("form_invalid"),
        fieldErrors: { cname_domain: tr.error("domain_taken") },
      };
    }
    console.error("updateAgencyBranding failed:", error);
    return { error: tr.error("generic") };
  }

  // Drop both cached lookups so the middleware stops serving stale branding
  // for the old domain and doesn't keep a negative entry for the new one.
  if (agency.cname_domain) await invalidateAgencyDomainCache(agency.cname_domain);
  if (newDomain) await invalidateAgencyDomainCache(newDomain);

  await logAgencyAudit({
    action: "agency.branding_updated",
    agencyMasterTenantId: agency.master_tenant_id,
    actorId: user.id,
    targetTable: "agencies",
    targetId: agency.id,
    metadata: { domain_changed: domainChanged },
  });

  revalidatePath("/agency/branding");
  return { success: true, domainChanged };
}
