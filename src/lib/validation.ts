import { z, type ZodError, type ZodTypeAny } from "zod";

/**
 * Returns the first validation issue's message, for a compact single-line
 * error response (matching this codebase's `{ error: string }` convention).
 */
export function firstIssueMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

/**
 * Coerces a `FormData` field (typed `FormDataEntryValue | null`, i.e.
 * `string | File | null`) to a string before running `schema`, so a missing
 * or non-string field fails with the schema's own message instead of a
 * generic "expected string, received null" error.
 */
export function formField<T extends ZodTypeAny>(schema: T) {
  return z.preprocess((value) => (typeof value === "string" ? value : ""), schema);
}

/**
 * Validates a Postgres `uuid` column value. Unlike Zod's built-in `.uuid()`,
 * this doesn't require RFC4122 version/variant nibbles — Postgres accepts
 * any 32 hex digits in the standard grouping, and some seeded/demo ids
 * (e.g. the marketing site's HeroPlayground organization) use that wider
 * range intentionally.
 */
export function postgresUuid(message = "A valid id is required.") {
  return z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, message);
}
