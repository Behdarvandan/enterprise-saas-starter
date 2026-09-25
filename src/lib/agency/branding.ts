import { z } from "zod";
import { deriveBrandPalette } from "@/lib/agency/palette";
import type { Json } from "@/types/database";

/**
 * Header the Edge middleware uses to hand the resolved agency to downstream
 * Server Components. `middleware.ts` deletes any inbound copy on every
 * request, so only a value the middleware itself wrote can ever reach
 * `getAgencyContext()`.
 */
export const AGENCY_CONTEXT_HEADER = "x-agency-context";

// Each branding field is validated independently and dropped when invalid
// (`.catch(undefined)`), so one bad value in the agency's jsonb never takes
// the whole white-label theme down with it.
const agencyBrandingSchema = z.object({
  // https only: the value ends up in an <img src>, so `javascript:`/`data:`
  // URLs must never pass.
  logo_url: z
    .string()
    .url()
    .refine((value) => value.startsWith("https://"))
    .optional()
    .catch(undefined),
  // A strict hex color keeps the value safe to place into a CSS variable and
  // lets us compute a readable foreground for it.
  primary_color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional()
    .catch(undefined),
  title: z.string().trim().min(1).max(80).optional().catch(undefined),
});

export type AgencyBranding = z.infer<typeof agencyBrandingSchema>;

export interface AgencyContext {
  id: string;
  masterTenantId: string;
  branding: AgencyBranding;
}

const agencyContextSchema = z.object({
  id: z.string().min(1),
  masterTenantId: z.string().min(1),
  branding: agencyBrandingSchema,
});

/** Validates the untrusted `agencies.branding` jsonb into public branding. */
export function parseAgencyBranding(raw: Json | undefined): AgencyBranding {
  const result = agencyBrandingSchema.safeParse(
    raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {},
  );
  return result.success ? result.data : {};
}

/** Header-safe (ASCII) serialization: titles may contain non-Latin text. */
export function encodeAgencyContext(context: AgencyContext): string {
  return encodeURIComponent(JSON.stringify(context));
}

/** Returns `null` for a missing or malformed header value. */
export function decodeAgencyContext(value: string | null | undefined): AgencyContext | null {
  if (!value) return null;
  try {
    const result = agencyContextSchema.safeParse(JSON.parse(decodeURIComponent(value)));
    return result.success ? result.data : null;
  } catch {
    // Malformed percent-encoding or JSON: treat as "no agency", never throw
    // out of a layout render.
    return null;
  }
}

/**
 * CSS custom properties applied to `<html>` for the agency's palette.
 * `--primary`/`--ring` are what the design system's `--color-primary` tokens
 * resolve from; an inline `<html style>` beats both the `:root` and `.dark`
 * declarations in globals.css. `--primary-color` is the agency-facing alias.
 */
export function getBrandingCssVars(branding: AgencyBranding): Record<string, string> {
  const color = branding.primary_color;
  if (!color) return {};

  const palette = deriveBrandPalette(color);

  return {
    "--primary-color": color,
    "--primary": palette.base,
    "--primary-hover": palette.hover,
    "--ring": palette.base,
    "--primary-foreground": palette.foreground,
  };
}
