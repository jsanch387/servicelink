/**
 * Short burst limits for Ask chat (`POST /api/assistant/chat`).
 * Monthly turn meter is separate — this only slows spam within a window.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { SlidingMemoryLimiter } from '@/server/rateLimit/slidingMemoryLimiter';

const MS_TEN_MIN = 10 * 60 * 1000;

/** ~10 owner questions per shop per 10 minutes. */
const BUSINESS_PER_10_MIN = 10;

const memory = new SlidingMemoryLimiter();

let redisSingleton: Redis | null | undefined;
type LimiterCache = { current: Ratelimit | null | undefined };
const businessCache: LimiterCache = { current: undefined };

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

function getLimiter(): Ratelimit | null {
  if (businessCache.current !== undefined) return businessCache.current;
  const redis = getRedis();
  if (!redis) {
    businessCache.current = null;
    return null;
  }
  businessCache.current = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(BUSINESS_PER_10_MIN, '10 m'),
    prefix: 'owner_api:assistant_chat:business',
    analytics: false,
  });
  return businessCache.current;
}

async function flushPending(result: { pending?: Promise<unknown> }) {
  try {
    if (result.pending) await result.pending;
  } catch {
    // ignore
  }
}

function safeBusinessId(businessId: string): string {
  return businessId.trim().slice(0, 128) || 'invalid';
}

export type AssistantChatRateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export async function assertAssistantChatRateLimits(
  _request: Request,
  businessId: string
): Promise<AssistantChatRateLimitResult> {
  const key = safeBusinessId(businessId);
  const limiter = getLimiter();

  if (limiter) {
    const out = await limiter.limit(key);
    await flushPending(out);
    if (out.success) return { ok: true };
    const retryAfterSec = Math.max(
      1,
      Math.ceil((out.reset - Date.now()) / 1000)
    );
    return { ok: false, retryAfterSec };
  }

  const memoryResult = memory.allow(
    `assistant_chat:business:${key}`,
    BUSINESS_PER_10_MIN,
    MS_TEN_MIN
  );
  if (memoryResult.success) return { ok: true };
  const retryAfterSec = Math.max(
    1,
    Math.ceil((memoryResult.reset - Date.now()) / 1000)
  );
  return { ok: false, retryAfterSec };
}
