import { z } from "zod";
import { isPlatformHost, isValidHostname } from "@/lib/agency/cname";
import { postgresUuid } from "@/lib/validation";

/**
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

export const agencyIdSchema = postgresUuid("A valid agency id is required.");
export const tenantIdSchema = postgresUuid("A valid tenant id is required.");

export const tenantNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name for the tenant.")
  .max(80, "The name can be at most 80 characters.");

// Mirrors the create_agency_tenant() check: lowercase words joined by hyphens.
export const tenantSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "The slug needs at least 3 characters.")
  .max(48, "The slug can be at most 48 characters.")
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens, e.g. acme-repairs.",
  );

/** Whole, non-negative token count from a form field. */
export const quotaTotalSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "Enter a whole number of tokens (0 or more).")
  .transform(Number)
  .pipe(z.number().max(MAX_QUOTA, "That amount is too large."));

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

const HTTPS_ONLY = "Must start with https://";

export const brandingFormSchema = z.object({
  title: optional(
    z
      .string()
      .trim()
      .min(1)
      .max(80, "The brand title can be at most 80 characters."),
  ),
  // https only: the value is rendered as an <img src> on every page of the
  // agency's white-labelled domain.
  logo_url: optional(
    z
      .string()
      .trim()
      .url("Enter a valid URL, e.g. https://cdn.youragency.com/logo.svg")
      .refine((value) => value.startsWith("https://"), HTTPS_ONLY),
  ),
  primary_color: optional(
    z
      .string()
      .trim()
      .regex(/^#[0-9a-f]{6}$/i, "Use a 6-digit hex color such as #7c3aed.")
      .transform((value) => value.toLowerCase()),
  ),
  cname_domain: z.preprocess(
    (value) => {
      const host = toHostname(value);
      return host === "" ? undefined : host;
    },
    z
      .string()
      .refine(isValidHostname, "Enter a valid domain such as ai.youragency.com.")
      .refine((host) => !isPlatformHost(host), "That domain belongs to the platform.")
      .optional(),
  ),
});

export type BrandingFormInput = z.infer<typeof brandingFormSchema>;
