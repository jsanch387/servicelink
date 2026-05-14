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

/** First 8 chars for quote/business UUID correlation without logging full ids. */
export function shortEntityIdForLog(id: string): string {
  const t = id.trim();
  return t.length >= 8 ? t.slice(0, 8) : t || '?';
}

function quoteSendRouteTag(routeLabel: string): 'new' | 'existing' {
  return routeLabel.includes('[id]') ? 'existing' : 'new';
}

function requestIdForLogLine(requestId: string): string {
  return requestId.length > 72 ? `${requestId.slice(0, 72)}…` : requestId;
}

function formatLogValue(key: string, raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (key === 'quoteId' || key === 'businessId') {
    return shortEntityIdForLog(t);
  }
  if (key === 'businessSlug' && t.length > 32) {
    return `${t.slice(0, 32)}…`;
  }
  if (t.length > 96) {
    return `${t.slice(0, 96)}…`;
  }
  if (/[\s=]/.test(t)) {
    return JSON.stringify(t);
  }
  return t;
}

/**
 * Single-line logs for quote send routes (mobile-friendly). No raw quote URLs,
 * tokens, or full UUIDs. Never pass customer email (even masked) unless
 * required for a specific diagnostic path.
 */
export function logQuoteSend(
  requestId: string,
  routeLabel: string,
  level: QuoteSendLogLevel,
  event: string,
  meta?: Record<string, unknown>
): void {
  const parts: string[] = [
    `req=${formatLogValue('req', requestIdForLogLine(requestId))}`,
    `route=${quoteSendRouteTag(routeLabel)}`,
  ];
  if (meta) {
    for (const [key, value] of Object.entries(meta)) {
      if (value === undefined || value === null) continue;
      const str =
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
          ? String(value)
          : JSON.stringify(value);
      const formatted = formatLogValue(key, str);
      if (formatted) parts.push(`${key}=${formatted}`);
    }
  }
  const line = `${ROUTE_PREFIX} ${event} ${parts.join(' ')}`;
  if (level === 'info') console.info(line);
  else if (level === 'warn') console.warn(line);
  else console.error(line);
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
  return shortEntityIdForLog(userId);
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
