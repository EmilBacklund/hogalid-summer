import { ApiError } from './responses';

/**
 * Best-effort in-memory rate limiting (SEC M3) for sensitive endpoints —
 * login attempts and invite redemption. Keyed by a caller string (IP + action).
 *
 * Caveat: state lives per server instance, so this is not a hard global limit
 * across a scaled-out deployment. It is enough to blunt brute-force/abuse from a
 * single client, which is the threat for this app's size. A shared store
 * (Turso/Upstash) can replace this later without touching call sites.
 */

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

export interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/**
 * Record a hit for `key`. Throws ApiError('rate_limited', 429) when the caller
 * has exceeded `limit` within `windowMs`.
 */
export function rateLimit(key: string, opts: RateLimitOptions): void {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return;
  }
  existing.count += 1;
  if (existing.count > opts.limit) {
    throw new ApiError('rate_limited', 429);
  }
}

/** Derive a best-effort client key from proxy headers. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-nf-client-connection-ip') ?? 'unknown';
}

/** Test-only: clear all rate-limit buckets between tests. */
export function resetRateLimitForTests(): void {
  buckets.clear();
}
