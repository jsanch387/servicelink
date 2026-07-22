import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

import { getClientIp } from '@/server/rateLimit/getClientIp';
import { SlidingMemoryLimiter } from '@/server/rateLimit/slidingMemoryLimiter';

const memory = new SlidingMemoryLimiter();
/** Limit confirmation-email spam: 1 request / 60s. */
const WINDOW_MS = 60_000;

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
  prefix: string
): Ratelimit | null {
  if (cache.current !== undefined) return cache.current;
  const redis = getRedis();
  if (!redis) {
    cache.current = null;
    return null;
  }
  cache.current = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1, '60 s'),
    prefix,
    analytics: false,
  });
  return cache.current;
}

async function limit(
  limiter: Ratelimit | null,
  key: string
): Promise<{ success: boolean; reset: number }> {
  if (limiter) {
    const result = await limiter.limit(key);
    try {
      if (result.pending) await result.pending;
    } catch {
      // best-effort analytics/background call
    }
    return { success: result.success, reset: result.reset };
  }
  return memory.allow(`account_email_change:${key}`, 1, WINDOW_MS);
}

export async function assertUpdateAccountEmailRateLimit(
  request: NextRequest,
  userId: string
): Promise<
  { ok: true } | { ok: false; retryAfterSec: number; reason: 'user' | 'ip' }
> {
  const userLimiter = getLimiter(userLimiterCache, 'account_email_change:user');
  const userResult = await limit(userLimiter, `user:${userId}`);
  if (!userResult.success) {
    return {
      ok: false,
      retryAfterSec: Math.max(
        1,
        Math.ceil((userResult.reset - Date.now()) / 1000)
      ),
      reason: 'user',
    };
  }

  const ip = getClientIp(request);
  const ipLimiter = getLimiter(ipLimiterCache, 'account_email_change:ip');
  const ipResult = await limit(ipLimiter, `ip:${ip}`);
  if (!ipResult.success) {
    return {
      ok: false,
      retryAfterSec: Math.max(
        1,
        Math.ceil((ipResult.reset - Date.now()) / 1000)
      ),
      reason: 'ip',
    };
  }

  return { ok: true };
}
