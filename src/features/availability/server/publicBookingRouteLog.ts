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

export { supabaseErrorForLogs };
