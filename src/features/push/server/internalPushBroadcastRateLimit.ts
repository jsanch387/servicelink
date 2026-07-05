import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

import { getClientIp } from '@/server/rateLimit/getClientIp';
import { SlidingMemoryLimiter } from '@/server/rateLimit/slidingMemoryLimiter';

const memory = new SlidingMemoryLimiter();

let redisSingleton: Redis | null | undefined;
const ipProbeCache: { current: Ratelimit | null | undefined } = {
  current: undefined,
};
const ipBroadcastCache: { current: Ratelimit | null | undefined } = {
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
  limit: number,
  window: `${number} s` | `${number} m` | `${number} h`
): Ratelimit | null {
  if (cache.current !== undefined) return cache.current;
  const redis = getRedis();
  if (!redis) {
    cache.current = null;
    return null;
  }
  cache.current = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix,
    analytics: false,
  });
  return cache.current;
}

async function consume(
  limiter: Ratelimit | null,
  memoryKey: string,
  memoryLimit: number,
  memoryWindowMs: number,
  key: string
): Promise<{ success: boolean; reset: number }> {
  if (limiter) {
    const result = await limiter.limit(key);
    try {
      if (result.pending) await result.pending;
    } catch {
      // best-effort
    }
    return { success: result.success, reset: result.reset };
  }
  const allowed = memory.allow(memoryKey, memoryLimit, memoryWindowMs);
  return allowed;
}

/** All broadcast attempts per IP (auth success or failure) — slows secret guessing. */
const PROBE_LIMIT = 30;
const PROBE_WINDOW_MS = 60 * 60 * 1000;

/** Full broadcasts (no testEmail) per IP — caps blast radius if secret leaks. */
const BROADCAST_LIMIT = 5;
const BROADCAST_WINDOW_MS = 60 * 60 * 1000;

export async function assertInternalPushBroadcastProbeRateLimit(
  request: NextRequest
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const ip = getClientIp(request);
  const probeLimiter = getLimiter(
    ipProbeCache,
    'internal_push_broadcast:probe',
    PROBE_LIMIT,
    '1 h'
  );
  const probe = await consume(
    probeLimiter,
    `internal_push_broadcast:probe:${ip}`,
    PROBE_LIMIT,
    PROBE_WINDOW_MS,
    ip
  );
  if (!probe.success) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((probe.reset - Date.now()) / 1000)),
    };
  }
  return { ok: true };
}

export async function assertInternalPushFullBroadcastRateLimit(
  request: NextRequest
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const ip = getClientIp(request);
  const broadcastLimiter = getLimiter(
    ipBroadcastCache,
    'internal_push_broadcast:full',
    BROADCAST_LIMIT,
    '1 h'
  );
  const broadcast = await consume(
    broadcastLimiter,
    `internal_push_broadcast:full:${ip}`,
    BROADCAST_LIMIT,
    BROADCAST_WINDOW_MS,
    ip
  );
  if (!broadcast.success) {
    return {
      ok: false,
      retryAfterSec: Math.max(
        1,
        Math.ceil((broadcast.reset - Date.now()) / 1000)
      ),
    };
  }
  return { ok: true };
}
