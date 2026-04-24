/**
 * Rate limits for public profile–related HTTP handlers (quote intake, view counts, profile API).
 *
 * **Production:** set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (Upstash Redis)
 * so limits are shared across all serverless isolates.
 *
 * **Without Redis:** an in-process sliding window applies per instance (weaker under scale;
 * still blocks casual abuse and reduces accidental stampedes).
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

import { getClientIp } from './getClientIp';
import { SlidingMemoryLimiter } from './slidingMemoryLimiter';

const MS_HOUR = 60 * 60 * 1000;
const MS_15M = 15 * 60 * 1000;

const memory = new SlidingMemoryLimiter();

let redisSingleton: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisSingleton !== undefined) {
    return redisSingleton;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisSingleton = null;
    return null;
  }
  redisSingleton = new Redis({ url, token });
  return redisSingleton;
}

function createLimiter(
  cache: { current: Ratelimit | null | undefined },
  prefix: string,
  max: number,
  window: '1 h' | '15 m' | '10 m'
): Ratelimit | null {
  if (cache.current !== undefined) {
    return cache.current;
  }
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

const quoteIpRl: { current: Ratelimit | null | undefined } = {
  current: undefined,
};
const quoteIpSlugRl: { current: Ratelimit | null | undefined } = {
  current: undefined,
};
const trackIpRl: { current: Ratelimit | null | undefined } = {
  current: undefined,
};
const trackIpSlugRl: { current: Ratelimit | null | undefined } = {
  current: undefined,
};
const profileIpRl: { current: Ratelimit | null | undefined } = {
  current: undefined,
};
const profileIpSlugRl: { current: Ratelimit | null | undefined } = {
  current: undefined,
};
const calendarFeedIcsIpRl: { current: Ratelimit | null | undefined } = {
  current: undefined,
};
const calendarFeedIcsIpTokenRl: { current: Ratelimit | null | undefined } = {
  current: undefined,
};
const calendarFeedLinkProbeIpRl: { current: Ratelimit | null | undefined } = {
  current: undefined,
};
const calendarFeedLinkUserRl: { current: Ratelimit | null | undefined } = {
  current: undefined,
};
const calendarFeedLinkIpRl: { current: Ratelimit | null | undefined } = {
  current: undefined,
};

async function flushPending(result: { pending?: Promise<unknown> }) {
  try {
    if (result.pending) await result.pending;
  } catch {
    // analytics / background — ignore
  }
}

async function consume(
  limiter: Ratelimit | null,
  id: string,
  memMax: number,
  memWindowMs: number
): Promise<{ ok: boolean; reset: number }> {
  if (limiter) {
    const out = await limiter.limit(id);
    await flushPending(out);
    return { ok: out.success, reset: out.reset };
  }
  const m = memory.allow(`rl:${id}`, memMax, memWindowMs);
  return { ok: m.success, reset: m.reset };
}

function tooManyRequests(resetMs: number): NextResponse {
  const retryAfterSec = Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please try again in a few minutes.',
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
        'Cache-Control': 'no-store',
      },
    }
  );
}

function safeSlugSegment(slug: string): string {
  return slug.trim().slice(0, 128) || 'invalid';
}

function safeFeedTokenSegment(token: string): string {
  return token.trim().slice(0, 128) || 'invalid';
}

function safeUserIdSegment(userId: string): string {
  return userId.trim().slice(0, 128) || 'invalid';
}

/** POST /api/public/quote-request — strict (bots, spam to one business). */
export async function assertPublicQuoteRequestRateLimits(
  request: NextRequest,
  businessSlug: string
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const slug = safeSlugSegment(businessSlug);

  const ipLimiter = createLimiter(quoteIpRl, 'public_api:quote:ip', 45, '1 h');
  const r1 = await consume(ipLimiter, `ip:${ip}`, 45, MS_HOUR);
  if (!r1.ok) return tooManyRequests(r1.reset);

  const slugLimiter = createLimiter(
    quoteIpSlugRl,
    'public_api:quote:ipslug',
    10,
    '1 h'
  );
  const r2 = await consume(slugLimiter, `ip:${ip}:slug:${slug}`, 10, MS_HOUR);
  if (!r2.ok) return tooManyRequests(r2.reset);

  return null;
}

/** POST /api/analytics/track-view — generous for real visitors, bounded for abuse. */
export async function assertPublicTrackViewRateLimits(
  request: NextRequest,
  businessSlug: string
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const slug = safeSlugSegment(businessSlug);

  const ipLimiter = createLimiter(trackIpRl, 'public_api:track:ip', 400, '1 h');
  const r1 = await consume(ipLimiter, `ip:${ip}`, 400, MS_HOUR);
  if (!r1.ok) return tooManyRequests(r1.reset);

  const slugLimiter = createLimiter(
    trackIpSlugRl,
    'public_api:track:ipslug',
    120,
    '15 m'
  );
  const r2 = await consume(slugLimiter, `ip:${ip}:slug:${slug}`, 120, MS_15M);
  if (!r2.ok) return tooManyRequests(r2.reset);

  return null;
}

/** GET /api/public/profile/[slug] — read-heavy; throttle scraping. */
export async function assertPublicProfileGetRateLimits(
  request: NextRequest,
  slug: string
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const s = safeSlugSegment(slug);

  const ipLimiter = createLimiter(
    profileIpRl,
    'public_api:profile:ip',
    360,
    '1 h'
  );
  const r1 = await consume(ipLimiter, `ip:${ip}`, 360, MS_HOUR);
  if (!r1.ok) return tooManyRequests(r1.reset);

  const slugLimiter = createLimiter(
    profileIpSlugRl,
    'public_api:profile:ipslug',
    150,
    '15 m'
  );
  const r2 = await consume(slugLimiter, `ip:${ip}:slug:${s}`, 150, MS_15M);
  if (!r2.ok) return tooManyRequests(r2.reset);

  return null;
}

/**
 * GET /api/calendar/feed/[token] — public ICS; calendar apps poll on their own schedule.
 * Per IP + per (IP + token) to cap scraping and hammering one feed URL.
 */
export async function assertCalendarFeedIcsRateLimits(
  request: NextRequest,
  feedToken: string
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const t = safeFeedTokenSegment(feedToken);

  const ipLimiter = createLimiter(
    calendarFeedIcsIpRl,
    'public_api:cal_feed_ics:ip',
    300,
    '1 h'
  );
  const r1 = await consume(ipLimiter, `ip:${ip}`, 300, MS_HOUR);
  if (!r1.ok) return tooManyRequests(r1.reset);

  const comboLimiter = createLimiter(
    calendarFeedIcsIpTokenRl,
    'public_api:cal_feed_ics:iptoken',
    120,
    '15 m'
  );
  const r2 = await consume(comboLimiter, `ip:${ip}:t:${t}`, 120, MS_15M);
  if (!r2.ok) return tooManyRequests(r2.reset);

  return null;
}

/**
 * GET /api/calendar/feed/link — caps anonymous traffic before Supabase auth (shared NAT caveat).
 */
export async function assertCalendarFeedLinkProbeRateLimits(
  request: NextRequest
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const probeLimiter = createLimiter(
    calendarFeedLinkProbeIpRl,
    'public_api:cal_feed_link:probe_ip',
    180,
    '1 h'
  );
  const r = await consume(probeLimiter, `ip:${ip}`, 180, MS_HOUR);
  if (!r.ok) return tooManyRequests(r.reset);
  return null;
}

/**
 * GET /api/calendar/feed/link — after session is valid; limits token regeneration / DB reads.
 */
export async function assertCalendarFeedLinkRateLimits(
  request: NextRequest,
  userId: string
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const uid = safeUserIdSegment(userId);

  const userLimiter = createLimiter(
    calendarFeedLinkUserRl,
    'public_api:cal_feed_link:user',
    45,
    '1 h'
  );
  const r1 = await consume(userLimiter, `user:${uid}`, 45, MS_HOUR);
  if (!r1.ok) return tooManyRequests(r1.reset);

  const ipLimiter = createLimiter(
    calendarFeedLinkIpRl,
    'public_api:cal_feed_link:ip',
    120,
    '1 h'
  );
  const r2 = await consume(ipLimiter, `ip:${ip}`, 120, MS_HOUR);
  if (!r2.ok) return tooManyRequests(r2.reset);

  return null;
}

/** Reject oversized JSON bodies before parsing (quote request payloads). */
export function assertReasonableJsonBodySize(
  request: NextRequest,
  maxBytes: number
): NextResponse | null {
  const raw = request.headers.get('content-length');
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (Number.isFinite(n) && n > maxBytes) {
    return NextResponse.json(
      { success: false, error: 'Request body too large' },
      { status: 413, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  return null;
}
