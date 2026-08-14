import {
  structuredLog,
  supabaseErrorForLogs,
  type StructuredLogLevel,
} from '@/server/logging/structuredLog';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

const SCOPE = 'memberships';

const REQUEST_ID_HEADERS = ['x-request-id', 'x-correlation-id'] as const;

export type MembershipsLogLevel = StructuredLogLevel;

/** Prefer inbound trace headers; otherwise mint a UUID for this request. */
export function getMembershipsRequestId(request: Request): string {
  for (const name of REQUEST_ID_HEADERS) {
    const raw = request.headers.get(name)?.trim();
    if (raw) return raw.slice(0, 128);
  }
  return randomUUID();
}

/** Short entity id for correlation without logging full UUIDs. */
export function shortIdForLog(id: string | null | undefined): string {
  const t = id?.trim() ?? '';
  return t.length >= 8 ? t.slice(0, 8) : t || '?';
}

/** Stripe ids (prod_/price_/acct_) — keep prefix + enough suffix to search Dashboard. */
export function shortStripeIdForLog(
  id: string | null | undefined
): string | undefined {
  const t = id?.trim();
  if (!t) return undefined;
  if (t.length <= 20) return t;
  return `${t.slice(0, 16)}…`;
}

/**
 * Stripe API errors: type/code/status/requestId are safe for prod support.
 * Full message only outside production.
 */
export function stripeErrorForLogs(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== 'object') {
    return { stripeError: 'unknown' };
  }

  const e = error as {
    type?: unknown;
    code?: unknown;
    statusCode?: unknown;
    requestId?: unknown;
    message?: unknown;
  };

  const meta: Record<string, unknown> = {};
  if (typeof e.type === 'string' && e.type.trim()) {
    meta.stripeType = e.type.trim();
  }
  if (typeof e.code === 'string' && e.code.trim()) {
    meta.stripeCode = e.code.trim();
  }
  if (typeof e.statusCode === 'number') {
    meta.stripeStatus = e.statusCode;
  }
  if (typeof e.requestId === 'string' && e.requestId.trim()) {
    meta.stripeRequestId = e.requestId.trim().slice(0, 64);
  }
  if (
    process.env.NODE_ENV !== 'production' &&
    typeof e.message === 'string' &&
    e.message.trim()
  ) {
    meta.stripeMessageDev = e.message.trim().slice(0, 200);
  }
  return meta;
}

/**
 * Memberships ops logging — prefer **warn/error** with a clear reason.
 * Avoid happy-path `info` noise in production; success is silent.
 */
export function logMemberships(
  requestId: string | undefined,
  level: MembershipsLogLevel,
  event: string,
  meta?: Record<string, unknown>
): void {
  structuredLog(SCOPE, requestId, level, event, meta);
}

export function membershipsJsonResponse(
  requestId: string,
  body: unknown,
  init?: { status?: number; headers?: Record<string, string> }
): NextResponse {
  const res = NextResponse.json(body, { status: init?.status ?? 200 });
  res.headers.set('X-Request-ID', requestId);
  res.headers.set('Cache-Control', 'no-store');
  if (init?.headers) {
    for (const [key, value] of Object.entries(init.headers)) {
      res.headers.set(key, value);
    }
  }
  return res;
}

export { supabaseErrorForLogs };
