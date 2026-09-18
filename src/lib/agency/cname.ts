// The fetch-only build: the default entry resolves to a Node variant that
// touches `process.version`, which the Edge runtime (middleware) rejects.
import { Redis } from "@upstash/redis/cloudflare";
import { z } from "zod";
import {
  decodeAgencyContext,
  encodeAgencyContext,
  parseAgencyBranding,
  type AgencyContext,
} from "@/lib/agency/branding";
import { createAnonClient } from "@/lib/supabase/anon";

/**
 * Custom-domain (CNAME) helpers for white-label routing.
 *
 * This module is imported by the Edge middleware, so it must stay free of
 * Node-only APIs (no `dns`, no `fs`): DNS is queried over HTTPS (DoH) with
 * plain `fetch`.
 */

// ---------------------------------------------------------------------------
// Host handling
// ---------------------------------------------------------------------------

const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{1,62}$/;

// Hosts the platform itself is served from; never treated as an agency domain.
// `PLATFORM_DOMAINS` (comma-separated) adds to these and matches the domain
// itself plus any subdomain of it.
const BUILTIN_PLATFORM_SUFFIXES = [".localhost", ".vercel.app"];
const DEFAULT_PLATFORM_DOMAINS = "localhost,pasargad.app";

/** Lowercases and strips port / trailing dot. `null` for an empty host. */
export function normalizeHost(host: string | null | undefined): string | null {
  if (!host) return null;

  let value = host.trim().toLowerCase();
  if (value.startsWith("[")) {
    // Bracketed IPv6 literal, optionally with a port.
    value = value.slice(0, value.indexOf("]") + 1);
  } else {
    value = value.replace(/:\d+$/, "");
  }
  value = value.replace(/\.$/, "");

  return value || null;
}

export function isValidHostname(host: string): boolean {
  return HOSTNAME_PATTERN.test(host);
}

function isIpLiteral(host: string): boolean {
  return host.startsWith("[") || /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

/** Whether `host` (already normalized) belongs to the platform itself. */
export function isPlatformHost(host: string): boolean {
  if (isIpLiteral(host)) return true;
  if (BUILTIN_PLATFORM_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;

  const domains = (process.env.PLATFORM_DOMAINS ?? DEFAULT_PLATFORM_DOMAINS)
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

// ---------------------------------------------------------------------------
// Domain -> agency lookup (cached; O(1) on the hot path)
// ---------------------------------------------------------------------------

const POSITIVE_TTL_SECONDS = 60;
const NEGATIVE_TTL_SECONDS = 30;
const RPC_TIMEOUT_MS = 2_000;
const LOCAL_CACHE_MAX_ENTRIES = 500;
const REDIS_KEY_PREFIX = "agency:domain:";
// Redis stores either `encodeAgencyContext(...)` or this sentinel. It is not
// valid JSON, so the client never deserializes it into something ambiguous
// with a missing key (`null`).
const NEGATIVE_SENTINEL = "none";

interface LocalCacheEntry {
  value: AgencyContext | null;
  expiresAt: number;
}

const localCache = new Map<string, LocalCacheEntry>();

let redisClient: Redis | null | undefined;

// Redis is optional: without the Upstash env vars the lookup just uses the
// per-isolate cache plus the RPC.
function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

function readLocal(host: string): LocalCacheEntry | null {
  const entry = localCache.get(host);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    localCache.delete(host);
    return null;
  }
  return entry;
}

function writeLocal(host: string, value: AgencyContext | null): void {
  if (localCache.size >= LOCAL_CACHE_MAX_ENTRIES) {
    // Maps iterate in insertion order, so this evicts the oldest entry.
    const oldest = localCache.keys().next().value;
    if (oldest !== undefined) localCache.delete(oldest);
  }
  const ttl = value ? POSITIVE_TTL_SECONDS : NEGATIVE_TTL_SECONDS;
  localCache.set(host, { value, expiresAt: Date.now() + ttl * 1000 });
}

async function readRedis(host: string): Promise<{ hit: boolean; value: AgencyContext | null }> {
  const redis = getRedis();
  if (!redis) return { hit: false, value: null };

  try {
    const cached = await redis.get<string>(`${REDIS_KEY_PREFIX}${host}`);
    if (cached === NEGATIVE_SENTINEL) return { hit: true, value: null };

    const decoded = decodeAgencyContext(cached);
    return decoded ? { hit: true, value: decoded } : { hit: false, value: null };
  } catch (error) {
    console.warn("[agency] Redis read failed, falling back to the database:", error);
    return { hit: false, value: null };
  }
}

async function writeRedis(host: string, value: AgencyContext | null): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(
      `${REDIS_KEY_PREFIX}${host}`,
      value ? encodeAgencyContext(value) : NEGATIVE_SENTINEL,
      { ex: value ? POSITIVE_TTL_SECONDS : NEGATIVE_TTL_SECONDS },
    );
  } catch (error) {
    console.warn("[agency] Redis write failed (non-fatal):", error);
  }
}

/**
 * Resolves a custom domain (already passed through `normalizeHost`) to its
 * agency, or `null` when no *verified* agency owns it. Lookup order:
 * per-isolate `Map` -> Upstash Redis -> the anon `get_agency_by_domain` RPC.
 *
 * Fails open: any Redis/RPC error yields `null` (the default Pasargad look)
 * and is not cached, so a Supabase blip can never take the site down or
 * poison the cache with a false negative.
 */
export async function getAgencyByDomain(host: string): Promise<AgencyContext | null> {
  if (!isValidHostname(host)) return null;

  const local = readLocal(host);
  if (local) return local.value;

  const remote = await readRedis(host);
  if (remote.hit) {
    writeLocal(host, remote.value);
    return remote.value;
  }

  const { data, error } = await createAnonClient()
    .rpc("get_agency_by_domain", { p_domain: host })
    .abortSignal(AbortSignal.timeout(RPC_TIMEOUT_MS));

  if (error) {
    console.warn("[agency] get_agency_by_domain failed, serving default branding:", error);
    return null;
  }

  const row = data?.[0];
  const context: AgencyContext | null = row
    ? {
        id: row.id,
        masterTenantId: row.master_tenant_id,
        branding: parseAgencyBranding(row.branding),
      }
    : null;

  writeLocal(host, context);
  await writeRedis(host, context);
  return context;
}

/**
 * Drops a domain from both cache layers (e.g. right after its verification
 * status changes). Other Edge isolates' in-memory copies expire on their TTL.
 */
export async function invalidateAgencyDomainCache(host: string): Promise<void> {
  const normalized = normalizeHost(host);
  if (!normalized) return;

  localCache.delete(normalized);

  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(`${REDIS_KEY_PREFIX}${normalized}`);
  } catch (error) {
    console.warn("[agency] Redis invalidation failed (entry will expire on its TTL):", error);
  }
}

// ---------------------------------------------------------------------------
// CNAME verification
// ---------------------------------------------------------------------------

export type CnameStatus = "pending" | "active" | "failed";

export interface CnameVerification {
  status: CnameStatus;
  /** The hostname the agency's CNAME is expected to point at. */
  target: string;
  /** CNAME targets currently published for the domain. */
  records: string[];
}

/** DNS could not be queried (network/resolver error) — not a verdict on the domain. */
export class DnsLookupError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DnsLookupError";
  }
}

const DOH_ENDPOINT = "https://cloudflare-dns.com/dns-query";
const DOH_TIMEOUT_MS = 5_000;
const DNS_TYPE_CNAME = 5;
const DNS_RCODE_NOERROR = 0;
const DNS_RCODE_NXDOMAIN = 3;

const dohResponseSchema = z.object({
  Status: z.number(),
  Answer: z.array(z.object({ type: z.number(), data: z.string() })).optional(),
});

export function getCnameTarget(): string {
  return (process.env.CNAME_TARGET ?? "cname.pasargad.app").trim().toLowerCase().replace(/\.$/, "");
}

/**
 * Checks whether `domain` has a CNAME pointing at the platform's CNAME target.
 *
 *  - `active`  — a published CNAME equals the target.
 *  - `pending` — no CNAME yet (record not created / still propagating).
 *  - `failed`  — a CNAME exists but points somewhere else (or the hostname
 *                is not a valid one).
 *
 * Throws `DnsLookupError` when DNS itself can't be queried, so callers keep
 * the previous status instead of recording a false `failed`. Note that a
 * proxied/flattened record (e.g. Cloudflare's orange cloud) hides the CNAME
 * and reads as `pending`; the domain must be DNS-only.
 */
export async function verifyCnameRecord(domain: string): Promise<CnameVerification> {
  const target = getCnameTarget();
  const name = normalizeHost(domain);

  if (!name || !isValidHostname(name)) {
    return { status: "failed", target, records: [] };
  }

  let payload: unknown;
  try {
    const response = await fetch(
      `${DOH_ENDPOINT}?name=${encodeURIComponent(name)}&type=CNAME`,
      {
        headers: { accept: "application/dns-json" },
        signal: AbortSignal.timeout(DOH_TIMEOUT_MS),
        cache: "no-store",
      },
    );
    if (!response.ok) {
      throw new Error(`DNS resolver responded with HTTP ${response.status}`);
    }
    payload = await response.json();
  } catch (error) {
    throw new DnsLookupError(`CNAME lookup failed for ${name}`, { cause: error });
  }

  const parsed = dohResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new DnsLookupError(`Unexpected DNS resolver response for ${name}`);
  }

  const { Status: rcode, Answer: answers } = parsed.data;
  if (rcode !== DNS_RCODE_NOERROR && rcode !== DNS_RCODE_NXDOMAIN) {
    throw new DnsLookupError(`DNS resolver returned RCODE ${rcode} for ${name}`);
  }

  const records = (answers ?? [])
    .filter((answer) => answer.type === DNS_TYPE_CNAME)
    .map((answer) => answer.data.trim().toLowerCase().replace(/\.$/, ""));

  if (records.length === 0) return { status: "pending", target, records };
  return { status: records.includes(target) ? "active" : "failed", target, records };
}
