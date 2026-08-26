/**
 * Rate limits for GET /api/payments/transactions (Stripe list + balance).
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

import { getClientIp } from '@/server/rateLimit/getClientIp';
import { SlidingMemoryLimiter } from '@/server/rateLimit/slidingMemoryLimiter';

const MS_MINUTE = 60 * 1000;
const MS_HOUR = 60 * 60 * 1000;

const USER_BURST_PER_MIN = 30;
const IP_BURST_PER_MIN = 60;
const USER_PER_HOUR = 180;
const IP_PER_HOUR = 360;

const memory = new SlidingMemoryLimiter();

let redisSingleton: Redis | null | undefined;

type LimiterCache = { current: Ratelimit | null | undefined };

const userBurstCache: LimiterCache = { current: undefined };
const userHourCache: LimiterCache = { current: undefined };
const ipBurstCache: LimiterCache = { current: undefined };
const ipHourCache: LimiterCache = { current: undefined };

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
  cache: LimiterCache,
  prefix: string,
  max: number,
  window: '1 m' | '1 h'
): Ratelimit | null {
  if (cache.current !== undefined) return cache.current;
  const redis = getRedis();
  if (!redis) {
    cache.current = null;
    return null;
  }
  cache.current = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, window),
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

export type OwnerPaymentsTransactionsRateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

interface WindowSpec {
  redisCache: LimiterCache;
  redisPrefix: string;
  max: number;
  window: '1 m' | '1 h';
  memoryKeyPrefix: string;
  memoryMs: number;
}

async function consumeWindow(
  key: string,
  spec: WindowSpec
): Promise<{ success: boolean; reset: number }> {
  const limiter = getLimiter(
    spec.redisCache,
    spec.redisPrefix,
    spec.max,
    spec.window
  );
  if (limiter) {
    const out = await limiter.limit(key);
    await flushPending(out);
    return { success: out.success, reset: out.reset };
  }
  return memory.allow(
    `${spec.memoryKeyPrefix}:${key}`,
    spec.max,
    spec.memoryMs
  );
}

const WINDOWS = {
  userBurst: {
    redisCache: userBurstCache,
    redisPrefix: 'owner_api:payments_transactions:user:burst',
    max: USER_BURST_PER_MIN,
    window: '1 m' as const,
    memoryKeyPrefix: 'payments_transactions:user:burst',
    memoryMs: MS_MINUTE,
  },
  userHour: {
    redisCache: userHourCache,
    redisPrefix: 'owner_api:payments_transactions:user:hour',
    max: USER_PER_HOUR,
    window: '1 h' as const,
    memoryKeyPrefix: 'payments_transactions:user:hour',
    memoryMs: MS_HOUR,
  },
  ipBurst: {
    redisCache: ipBurstCache,
    redisPrefix: 'owner_api:payments_transactions:ip:burst',
    max: IP_BURST_PER_MIN,
    window: '1 m' as const,
    memoryKeyPrefix: 'payments_transactions:ip:burst',
    memoryMs: MS_MINUTE,
  },
  ipHour: {
    redisCache: ipHourCache,
    redisPrefix: 'owner_api:payments_transactions:ip:hour',
    max: IP_PER_HOUR,
    window: '1 h' as const,
    memoryKeyPrefix: 'payments_transactions:ip:hour',
    memoryMs: MS_HOUR,
  },
};

export async function assertOwnerPaymentsTransactionsRateLimits(
  request: NextRequest,
  userId: string
): Promise<OwnerPaymentsTransactionsRateLimitResult> {
  const userKey = safeUserIdSegment(userId);

  for (const spec of [WINDOWS.userBurst, WINDOWS.userHour]) {
    const out = await consumeWindow(`user:${userKey}`, spec);
    if (!out.success) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((out.reset - Date.now()) / 1000)),
      };
    }
  }

  const ip = getClientIp(request);
  for (const spec of [WINDOWS.ipBurst, WINDOWS.ipHour]) {
    const out = await consumeWindow(`ip:${ip}`, spec);
    if (!out.success) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((out.reset - Date.now()) / 1000)),
      };
    }
  }

  return { ok: true };
}
