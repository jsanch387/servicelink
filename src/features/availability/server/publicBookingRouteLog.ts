import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';
import {
  structuredLog,
  supabaseErrorForLogs,
} from '@/server/logging/structuredLog';

const SCOPE = 'public-bookings-post';

const REQUEST_ID_HEADERS = ['x-request-id', 'x-correlation-id'] as const;

export function getPublicBookingRequestId(
  request: Pick<NextRequest, 'headers'>
): string {
  for (const name of REQUEST_ID_HEADERS) {
    const raw = request.headers.get(name)?.trim();
    if (raw) return raw.slice(0, 128);
  }
  return randomUUID();
}

export type PublicBookingLogLevel = 'info' | 'warn' | 'error';

export function logPublicBookingPost(
  requestId: string,
  level: PublicBookingLogLevel,
  event: string,
  meta?: Record<string, unknown>
): void {
  structuredLog(SCOPE, requestId, level, event, meta);
}

/**
 * One-line transactional logs for booking create (grep: `[bookings]`).
 * No JSON blobs; values must stay short — no PII, tokens, or full error stacks.
 */
export function logBookingTransaction(
  requestId: string,
  level: PublicBookingLogLevel,
  message: string,
  attrs?: Record<string, string | number | boolean>
): void {
  let suffix = '';
  if (attrs && Object.keys(attrs).length > 0) {
    suffix = ` ${Object.entries(attrs)
      .map(([k, v]) => {
        const s = String(v).replace(/\s+/g, '_').slice(0, 96);
        return `${k}=${s}`;
      })
      .join(' ')}`;
  }
  const line = `[bookings] ${message}${suffix} rid=${requestId}`;
  if (level === 'info') console.info(line);
  else if (level === 'warn') console.warn(line);
  else console.error(line);
}

export { supabaseErrorForLogs };
