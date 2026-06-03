import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ROUTE_PREFIX = '[review-invite]';

const REQUEST_ID_HEADERS = ['x-request-id', 'x-correlation-id'] as const;

export type ReviewInviteLogSource = 'mobile_api' | 'web_patch';

export type ReviewInviteLogTrace = {
  requestId: string;
  source: ReviewInviteLogSource;
  businessIdPrefix?: string;
  bookingIdPrefix?: string;
};

export type ReviewInviteFinishedOutcome =
  | { kind: 'sent'; inviteId?: string }
  | { kind: 'skipped'; reason: string }
  | { kind: 'invite_no_email'; inviteId: string; emailErrorHint?: string }
  | { kind: 'failed'; error: string }
  | { kind: 'rejected'; error: string; httpStatus: number };

export function getReviewInviteRequestId(
  request: Pick<NextRequest, 'headers'> | Pick<Request, 'headers'>
): string {
  for (const name of REQUEST_ID_HEADERS) {
    const raw = request.headers.get(name)?.trim();
    if (raw) return raw.slice(0, 128);
  }
  return randomUUID();
}

export function shortEntityIdForLog(id: string): string {
  const t = id.trim();
  return t.length >= 8 ? t.slice(0, 8) : t || '?';
}

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

export function supabaseErrorForLogs(
  error: { code?: string; message?: string } | null | undefined
): Record<string, string> {
  if (!error) return {};
  const meta: Record<string, string> = {};
  if (error.code) meta.supabaseCode = error.code;
  if (process.env.NODE_ENV !== 'production' && error.message?.trim()) {
    meta.supabaseMessageDev = error.message.trim().slice(0, 120);
  }
  return meta;
}

export function truncateLogDetail(value: string, max = 80): string {
  const t = value.trim();
  if (!t) return '';
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function buildReviewInviteTrace(
  requestId: string,
  source: ReviewInviteLogSource,
  ids?: { businessId?: string; bookingId?: string }
): ReviewInviteLogTrace {
  return {
    requestId,
    source,
    ...(ids?.businessId
      ? { businessIdPrefix: shortEntityIdForLog(ids.businessId) }
      : {}),
    ...(ids?.bookingId
      ? { bookingIdPrefix: shortEntityIdForLog(ids.bookingId) }
      : {}),
  };
}

function requestIdForLogLine(requestId: string): string {
  return requestId.length > 72 ? `${requestId.slice(0, 72)}…` : requestId;
}

function appendTraceContext(
  parts: string[],
  trace: ReviewInviteLogTrace
): void {
  parts.push(`req=${requestIdForLogLine(trace.requestId)}`);
  parts.push(`source=${trace.source}`);
  if (trace.businessIdPrefix) parts.push(`biz=${trace.businessIdPrefix}`);
  if (trace.bookingIdPrefix) parts.push(`booking=${trace.bookingIdPrefix}`);
}

/**
 * One line per review-invite transaction (success, skip, or failure).
 */
export function logReviewInviteFinished(
  trace: ReviewInviteLogTrace,
  outcome: ReviewInviteFinishedOutcome
): void {
  const parts: string[] = ['finished'];
  appendTraceContext(parts, trace);
  parts.push(`outcome=${outcome.kind}`);

  if (outcome.kind === 'sent' && outcome.inviteId) {
    parts.push(`invite=${shortEntityIdForLog(outcome.inviteId)}`);
  }
  if (outcome.kind === 'skipped') {
    parts.push(`reason=${outcome.reason}`);
  }
  if (outcome.kind === 'invite_no_email') {
    parts.push(`invite=${shortEntityIdForLog(outcome.inviteId)}`);
    if (outcome.emailErrorHint) {
      parts.push(`emailErr=${truncateLogDetail(outcome.emailErrorHint, 60)}`);
    }
  }
  if (outcome.kind === 'failed') {
    parts.push(`error=${truncateLogDetail(outcome.error, 96)}`);
  }
  if (outcome.kind === 'rejected') {
    parts.push(`http=${outcome.httpStatus}`);
    parts.push(`error=${truncateLogDetail(outcome.error, 96)}`);
  }

  const line = `${ROUTE_PREFIX} ${parts.join(' ')}`;
  if (outcome.kind === 'failed') {
    console.error(line);
    return;
  }
  if (outcome.kind === 'rejected' || outcome.kind === 'invite_no_email') {
    console.warn(line);
    return;
  }
  console.info(line);
}

export function reviewInviteJsonResponse(
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
