import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ROUTE_PREFIX = '[quotes-send]';

/** Headers mobile or gateways can set for cross-system tracing (first match wins). */
const REQUEST_ID_HEADERS = ['x-request-id', 'x-correlation-id'] as const;

export function getQuoteSendRequestId(
  request: Pick<NextRequest, 'headers'>
): string {
  for (const name of REQUEST_ID_HEADERS) {
    const raw = request.headers.get(name)?.trim();
    if (raw) return raw.slice(0, 128);
  }
  return randomUUID();
}

/** Reduces PII in logs while keeping enough to match support tickets. */
export function maskEmailForLog(email: string): string {
  const t = email.trim();
  const at = t.indexOf('@');
  if (at <= 0) return '[invalid]';
  const local = t.slice(0, at);
  const domain = t.slice(at + 1);
  if (!domain) return '[invalid]';
  const shown = local.length <= 1 ? '*' : `${local[0]}***${local.slice(-1)}`;
  return `${shown}@${domain}`;
}

export type QuoteSendLogLevel = 'info' | 'warn' | 'error';

/**
 * Structured logs for quote send routes. Never pass raw quote URL or tokens.
 */
export function logQuoteSend(
  requestId: string,
  routeLabel: string,
  level: QuoteSendLogLevel,
  event: string,
  meta?: Record<string, unknown>
): void {
  const payload = JSON.stringify({
    requestId,
    route: routeLabel,
    event,
    ...meta,
  });
  const line = `${ROUTE_PREFIX} ${event}`;
  if (level === 'info') console.info(line, payload);
  else if (level === 'warn') console.warn(line, payload);
  else console.error(line, payload);
}

/**
 * Supabase / PostgREST errors: log **code** always; **message** only outside
 * production (messages can echo row data or SQL fragments).
 */
export function supabaseErrorForLogs(
  error: { code?: string; message?: string } | null | undefined
): Record<string, unknown> {
  if (!error) return {};
  const meta: Record<string, unknown> = {};
  if (error.code) meta.supabaseCode = error.code;
  if (process.env.NODE_ENV !== 'production' && error.message?.trim()) {
    meta.supabaseMessageDev = error.message.trim().slice(0, 200);
  }
  return meta;
}

/** First 8 chars of UUID for logs (correlate without full PII fingerprint). */
export function shortUserIdForLog(userId: string): string {
  const t = userId.trim();
  return t.length >= 8 ? t.slice(0, 8) : t || '?';
}

/** Truncate third-party / email provider error strings for logs. */
export function truncateLogDetail(value: string, max = 80): string {
  const t = value.trim();
  if (!t) return '';
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

/** JSON responses from quote send routes always echo `X-Request-ID` for mobile ↔ server tracing. */
export function quoteSendJsonResponse(
  requestId: string,
  body: unknown,
  status: number,
  extraHeaders?: Record<string, string>
): NextResponse {
  const headers: Record<string, string> = {
    'X-Request-ID': requestId,
    'Cache-Control': 'no-store',
    ...extraHeaders,
  };
  return NextResponse.json(body, { status, headers });
}
