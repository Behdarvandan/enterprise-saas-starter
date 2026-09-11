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
 * Checks whether the given key is still within its rate limit.
 *
 * @returns `true` when the request is allowed, `false` when it has been
 * rate-limited and should be rejected.
 */
export async function checkRateLimit(key: string): Promise<boolean> {
  const { success } = await ratelimit.limit(key);
  return success;
}
