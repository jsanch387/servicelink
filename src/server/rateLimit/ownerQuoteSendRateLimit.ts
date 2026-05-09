/**
 * Rate limits for authenticated owner quote send (`POST /api/quotes/send`,
 * `POST /api/quotes/[id]/send`). Throttles abuse and accidental loops without
 * blocking normal business use.
 *
 * **Production:** set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
 * so limits are shared across serverless instances.
 *
 * **Without Redis:** in-process sliding window per instance (same pattern as
 * `deleteAccountRateLimit` / `publicApiRateLimit`).
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

import { getClientIp } from '@/server/rateLimit/getClientIp';
import { SlidingMemoryLimiter } from '@/server/rateLimit/slidingMemoryLimiter';

const MS_HOUR = 60 * 60 * 1000;

/** Per signed-in user: sends per hour. */
const USER_MAX_PER_HOUR = 60;
/** Per client IP: additional cap (shared NAT, compromised token). */
const IP_MAX_PER_HOUR = 120;

const memory = new SlidingMemoryLimiter();

let redisSingleton: Redis | null | undefined;
const userLimiterCache: { current: Ratelimit | null | undefined } = {
  current: undefined,
};
const ipLimiterCache: { current: Ratelimit | null | undefined } = {
  current: undefined,
};

function getRedis(): Redis | null {
  if (redisSingleton !== undefined) return redisSingleton;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisSingleton = null;
    return null;
  }
  redisSingleton = new Redis({ url, token });
  return redisSingleton;
}

function getLimiter(
  cache: { current: Ratelimit | null | undefined },
  prefix: string,
  max: number
): Ratelimit | null {
  if (cache.current !== undefined) return cache.current;
  const redis = getRedis();
  if (!redis) {
    cache.current = null;
    return null;
  }
  cache.current = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, '1 h'),
    prefix,
    analytics: false,
  });
  return cache.current;
}

async function flushPending(result: { pending?: Promise<unknown> }) {
  try {
    if (result.pending) await result.pending;
  } catch {
    // ignore
  }
}

function safeUserIdSegment(userId: string): string {
  return userId.trim().slice(0, 128) || 'invalid';
}

export type OwnerQuoteSendRateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number; reason: 'user' | 'ip' };

/**
 * Call after auth succeeds, before heavy DB work.
 */
export async function assertOwnerQuoteSendRateLimits(
  request: NextRequest,
  userId: string
): Promise<OwnerQuoteSendRateLimitResult> {
  const userKey = safeUserIdSegment(userId);
  const userLimiter = getLimiter(
    userLimiterCache,
    'owner_api:quote_send:user',
    USER_MAX_PER_HOUR
  );

  if (userLimiter) {
    const out = await userLimiter.limit(`user:${userKey}`);
    await flushPending(out);
    if (!out.success) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((out.reset - Date.now()) / 1000)),
        reason: 'user',
      };
    }
  } else {
    const m = memory.allow(
      `owner_quote_send:user:${userKey}`,
      USER_MAX_PER_HOUR,
      MS_HOUR
    );
    if (!m.success) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((m.reset - Date.now()) / 1000)),
        reason: 'user',
      };
    }
  }

  const ip = getClientIp(request);
  const ipLimiter = getLimiter(
    ipLimiterCache,
    'owner_api:quote_send:ip',
    IP_MAX_PER_HOUR
  );

  if (ipLimiter) {
    const out = await ipLimiter.limit(`ip:${ip}`);
    await flushPending(out);
    if (!out.success) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((out.reset - Date.now()) / 1000)),
        reason: 'ip',
      };
    }
  } else {
    const m = memory.allow(
      `owner_quote_send:ip:${ip}`,
      IP_MAX_PER_HOUR,
      MS_HOUR
    );
    if (!m.success) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((m.reset - Date.now()) / 1000)),
        reason: 'ip',
      };
    }
  }

  return { ok: true };
}
