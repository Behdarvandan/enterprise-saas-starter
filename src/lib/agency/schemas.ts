import { z } from "zod";
import { isPlatformHost, isValidHostname } from "@/lib/agency/cname";
import { postgresUuid } from "@/lib/validation";

/**
 * Validation failures are reported as stable keys (`agency.validation.<key>`)
 * rather than English text: the Server Actions translate them per request
 * locale, and the client never sees raw zod messages.
 *
 * Input schemas for the agency portal's Server Actions. Server-side only:
 * `cname.ts` pulls in the Edge lookup stack, which the browser bundle should
 * never carry (client forms validate with plain HTML attributes and rely on
 * these for the authoritative check).
 */

// Postgres `integer` upper bound; `agency_tenants.quota_*` are int4 columns.
const MAX_QUOTA = 2_147_483_647;

/** Empty / whitespace-only form fields mean "not provided". */
function optional<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    schema.optional(),
  );
}

export const agencyIdSchema = postgresUuid("agency_id_invalid");
export const tenantIdSchema = postgresUuid("tenant_id_invalid");

export const tenantNameSchema = z
  .string()
  .trim()
  .min(1, "tenant_name_required")
  .max(80, "tenant_name_max");

// Mirrors the create_agency_tenant() check: lowercase words joined by hyphens.
export const tenantSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "slug_min")
  .max(48, "slug_max")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug_format");

/** Whole, non-negative token count from a form field. */
export const quotaTotalSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "quota_digits")
  .transform(Number)
  .pipe(z.number().max(MAX_QUOTA, "quota_max"));

export const skillListSchema = z.array(z.string().min(1).max(64)).max(32);

// Accepts what people actually paste: `https://AI.Agency.com/path` -> host.
function toHostname(value: unknown): unknown {
  if (typeof value !== "string") return value;
  return value
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

const HTTPS_ONLY = "https_only";

export const brandingFormSchema = z.object({
  title: optional(
    z
      .string()
      .trim()
      .min(1)
      .max(80, "brand_title_max"),
  ),
  // https only: the value is rendered as an <img src> on every page of the
  // agency's white-labelled domain.
  logo_url: optional(
    z
      .string()
      .trim()
      .url("logo_url_invalid")
      .refine((value) => value.startsWith("https://"), HTTPS_ONLY),
  ),
  primary_color: optional(
    z
      .string()
      .trim()
      .regex(/^#[0-9a-f]{6}$/i, "color_hex")
      .transform((value) => value.toLowerCase()),
  ),
  cname_domain: z.preprocess(
    (value) => {
      const host = toHostname(value);
      return host === "" ? undefined : host;
    },
    z
      .string()
      .refine(isValidHostname, "domain_invalid")
      .refine((host) => !isPlatformHost(host), "domain_platform")
      .optional(),
  ),
});

export type BrandingFormInput = z.infer<typeof brandingFormSchema>;

/** Every message key the schemas above can emit (`agency.validation.<key>`). */
export const VALIDATION_KEYS = [
  "agency_id_invalid",
  "tenant_id_invalid",
  "tenant_name_required",
  "tenant_name_max",
  "slug_min",
  "slug_max",
  "slug_format",
  "quota_digits",
  "quota_max",
  "brand_title_max",
  "logo_url_invalid",
  "https_only",
  "color_hex",
  "domain_invalid",
  "domain_platform",
] as const;

export type ValidationKey = (typeof VALIDATION_KEYS)[number];

/** Narrows an issue message to a known key; anything else (e.g. a zod default) is unknown. */
export function asValidationKey(message: string | undefined): ValidationKey | null {
  return (VALIDATION_KEYS as readonly (string | undefined)[]).includes(message)
    ? (message as ValidationKey)
    : null;
}
