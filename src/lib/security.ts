import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison.
 *
 * Both inputs are hashed first so the comparison always runs over equal-length
 * buffers: `timingSafeEqual` throws on length mismatch, and an early
 * length-based return would leak the secret's length through timing.
 */
export function safeEqualStrings(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left, "utf8").digest();
  const rightDigest = createHash("sha256").update(right, "utf8").digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

/**
 * Validates an `Authorization: Bearer <secret>` header against `secret`
 * in constant time.
 */
export function verifyBearerToken(
  authorizationHeader: string | null,
  secret: string,
): boolean {
  if (!secret || !authorizationHeader) return false;

  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  const token = match?.[1];
  if (!token) return false;

  return safeEqualStrings(token, secret);
}

/**
 * Verifies a hex-encoded HMAC-SHA256 signature over `rawBody` in constant
 * time (the scheme used by Lemon Squeezy's `X-Signature` header).
 */
export function verifyHmacSha256Hex(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return safeEqualStrings(expected, signature.trim().toLowerCase());
}

/**
 * Returns `next` only when it is a same-origin relative path, otherwise
 * `fallback`.
 *
 * Guards post-auth redirects (`?next=`) against open-redirect abuse: a bare
 * `${origin}${next}` concatenation is exploitable with values such as
 * `@evil.example` (→ `https://host@evil.example`), `//evil.example` or
 * `/\evil.example`, which browsers normalise into a cross-origin target.
 */
export function sanitizeRedirectPath(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  // Protocol-relative ("//host") and backslash variants ("/\host").
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  // Control characters (CR/LF/tab) are stripped by URL parsers and can smuggle
  // a second slash past the checks above.
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback;

  return next;
}
