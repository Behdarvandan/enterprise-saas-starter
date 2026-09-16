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
