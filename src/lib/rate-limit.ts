import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Shared Upstash Redis-backed rate limiter.
 *
 * `Redis.fromEnv()` reads `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN` from the environment automatically. Routes may
 * create their own `Ratelimit` instances with different limits later if
 * needed, but this single shared default is used for now.
 */
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"),
});

/**
 * Tighter limiter for the public lead-intake form: it's spam-prone (no
 * auth, no CAPTCHA) and low-volume by nature, unlike booking/chat traffic,
 * so it gets its own instance rather than sharing the default's budget.
 */
export const leadRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "300 s"),
});

/**
 * Checks whether the given key is still within its rate limit.
 *
 * Fails open: if Redis is unreachable or misconfigured, the underlying
 * endpoint should stay up rather than 500 for every caller, so the request
 * is allowed through and the failure is only logged server-side.
 *
 * @param limiter Which `Ratelimit` instance to check against; defaults to
 * the shared default so existing call sites are unaffected.
 * @returns `true` when the request is allowed, `false` when it has been
 * rate-limited and should be rejected.
 */
export async function checkRateLimit(
  key: string,
  limiter: Ratelimit = ratelimit,
): Promise<boolean> {
  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch (error) {
    console.warn("[rate-limit] Redis error, failing open:", error);
    return true;
  }
}
