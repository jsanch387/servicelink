/**
 * Rate limits for Tap to Pay routes (connection tokens + PaymentIntent create).
 *
 * Connection-token limits are **generous** so app warm-up and Terminal SDK token
 * refresh do not hit 429 during normal use. Intent limits are tighter (each call
 * creates a Stripe PaymentIntent).
 *
 * **Production:** set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

import { getClientIp } from '@/server/rateLimit/getClientIp';
import { SlidingMemoryLimiter } from '@/server/rateLimit/slidingMemoryLimiter';

const MS_MINUTE = 60 * 1000;
const MS_HOUR = 60 * 60 * 1000;

/** Burst: Terminal SDK + warm-up can request several tokens per minute. */
const CONN_USER_BURST_PER_MIN = 40;
const CONN_IP_BURST_PER_MIN = 80;
/** Sustained: full workday with foreground + collection. */
const CONN_USER_PER_HOUR = 240;
const CONN_IP_PER_HOUR = 480;

const INTENT_USER_BURST_PER_MIN = 15;
const INTENT_IP_BURST_PER_MIN = 30;
const INTENT_USER_PER_HOUR = 80;
const INTENT_IP_PER_HOUR = 160;

const memory = new SlidingMemoryLimiter();

let redisSingleton: Redis | null | undefined;

type LimiterCache = { current: Ratelimit | null | undefined };

const connUserBurstCache: LimiterCache = { current: undefined };
const connUserHourCache: LimiterCache = { current: undefined };
const connIpBurstCache: LimiterCache = { current: undefined };
const connIpHourCache: LimiterCache = { current: undefined };
const intentUserBurstCache: LimiterCache = { current: undefined };
const intentUserHourCache: LimiterCache = { current: undefined };
const intentIpBurstCache: LimiterCache = { current: undefined };
const intentIpHourCache: LimiterCache = { current: undefined };

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

export type OwnerTapToPayRateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number; reason: 'user' | 'ip' };

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

async function assertTapToPayRateLimits(
  request: NextRequest,
  userId: string,
  windows: {
    userBurst: WindowSpec;
    userHour: WindowSpec;
    ipBurst: WindowSpec;
    ipHour: WindowSpec;
  }
): Promise<OwnerTapToPayRateLimitResult> {
  const userKey = safeUserIdSegment(userId);

  for (const spec of [windows.userBurst, windows.userHour]) {
    const out = await consumeWindow(`user:${userKey}`, spec);
    if (!out.success) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((out.reset - Date.now()) / 1000)),
        reason: 'user',
      };
    }
  }

  const ip = getClientIp(request);
  for (const spec of [windows.ipBurst, windows.ipHour]) {
    const out = await consumeWindow(`ip:${ip}`, spec);
    if (!out.success) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((out.reset - Date.now()) / 1000)),
        reason: 'ip',
      };
    }
  }

  return { ok: true };
}

const CONNECTION_TOKEN_WINDOWS = {
  userBurst: {
    redisCache: connUserBurstCache,
    redisPrefix: 'owner_api:tap_to_pay:conn:user:burst',
    max: CONN_USER_BURST_PER_MIN,
    window: '1 m' as const,
    memoryKeyPrefix: 'tap_to_pay_conn:user:burst',
    memoryMs: MS_MINUTE,
  },
  userHour: {
    redisCache: connUserHourCache,
    redisPrefix: 'owner_api:tap_to_pay:conn:user:hour',
    max: CONN_USER_PER_HOUR,
    window: '1 h' as const,
    memoryKeyPrefix: 'tap_to_pay_conn:user:hour',
    memoryMs: MS_HOUR,
  },
  ipBurst: {
    redisCache: connIpBurstCache,
    redisPrefix: 'owner_api:tap_to_pay:conn:ip:burst',
    max: CONN_IP_BURST_PER_MIN,
    window: '1 m' as const,
    memoryKeyPrefix: 'tap_to_pay_conn:ip:burst',
    memoryMs: MS_MINUTE,
  },
  ipHour: {
    redisCache: connIpHourCache,
    redisPrefix: 'owner_api:tap_to_pay:conn:ip:hour',
    max: CONN_IP_PER_HOUR,
    window: '1 h' as const,
    memoryKeyPrefix: 'tap_to_pay_conn:ip:hour',
    memoryMs: MS_HOUR,
  },
};

const INTENT_WINDOWS = {
  userBurst: {
    redisCache: intentUserBurstCache,
    redisPrefix: 'owner_api:tap_to_pay:intent:user:burst',
    max: INTENT_USER_BURST_PER_MIN,
    window: '1 m' as const,
    memoryKeyPrefix: 'tap_to_pay_intent:user:burst',
    memoryMs: MS_MINUTE,
  },
  userHour: {
    redisCache: intentUserHourCache,
    redisPrefix: 'owner_api:tap_to_pay:intent:user:hour',
    max: INTENT_USER_PER_HOUR,
    window: '1 h' as const,
    memoryKeyPrefix: 'tap_to_pay_intent:user:hour',
    memoryMs: MS_HOUR,
  },
  ipBurst: {
    redisCache: intentIpBurstCache,
    redisPrefix: 'owner_api:tap_to_pay:intent:ip:burst',
    max: INTENT_IP_BURST_PER_MIN,
    window: '1 m' as const,
    memoryKeyPrefix: 'tap_to_pay_intent:ip:burst',
    memoryMs: MS_MINUTE,
  },
  ipHour: {
    redisCache: intentIpHourCache,
    redisPrefix: 'owner_api:tap_to_pay:intent:ip:hour',
    max: INTENT_IP_PER_HOUR,
    window: '1 h' as const,
    memoryKeyPrefix: 'tap_to_pay_intent:ip:hour',
    memoryMs: MS_HOUR,
  },
};

/** Merchant + booking connection-token routes (shared bucket). */
export async function assertOwnerTapToPayConnectionTokenRateLimits(
  request: NextRequest,
  userId: string
): Promise<OwnerTapToPayRateLimitResult> {
  return assertTapToPayRateLimits(request, userId, CONNECTION_TOKEN_WINDOWS);
}

/** Booking PaymentIntent create. */
export async function assertOwnerTapToPayIntentRateLimits(
  request: NextRequest,
  userId: string
): Promise<OwnerTapToPayRateLimitResult> {
  return assertTapToPayRateLimits(request, userId, INTENT_WINDOWS);
}

export const TAP_TO_PAY_RATE_LIMIT_ERROR =
  'Too many Tap to Pay requests. Please wait a moment and try again.';
