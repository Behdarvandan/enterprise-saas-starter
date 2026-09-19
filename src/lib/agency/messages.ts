import { getTranslations } from "next-intl/server";
import { asValidationKey } from "@/lib/agency/schemas";
import type { AgencyErrorKey } from "@/lib/agency/rpc-errors";

/** Extra `agency.errors` keys the actions raise themselves (not RPC errors). */
export type AgencyActionErrorKey =
  | AgencyErrorKey
  | "org_not_found"
  | "invalid_skills"
  | "plan_limit"
  | "form_invalid"
  | "domain_taken";

/**
 * Per-request translators for the agency Server Actions: error keys and zod
 * validation keys resolve to copy in the caller's locale.
 */
export async function getAgencyTranslators() {
  const t = await getTranslations("agency");

  return {
    error: (key: AgencyActionErrorKey, values?: { skills: string }) =>
      values ? t(`errors.${key}` as "errors.plan_limit", values) : t(`errors.${key}`),
    /** A zod issue message (a `ValidationKey`); anything else is an unexpected failure. */
    validation: (message: string | undefined) => {
      const key = asValidationKey(message);
      return key ? t(`validation.${key}`) : t("errors.generic");
    },
  };
}
