import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ROUTE_PREFIX = '[maintenance-enrollment]';

const REQUEST_ID_HEADERS = ['x-request-id', 'x-correlation-id'] as const;

const ALLOWED_LOG_META = new Set([
  'status',
  'code',
  'supabaseCode',
  'emailSent',
]);

export function getMaintenanceEnrollmentRequestId(
  request: Pick<NextRequest, 'headers'>
): string {
  for (const name of REQUEST_ID_HEADERS) {
    const raw = request.headers.get(name)?.trim();
    if (raw) return raw.slice(0, 128);
  }
  return randomUUID();
}

export type MaintenanceEnrollmentLogLevel = 'info' | 'warn' | 'error';

function shortRequestIdForLog(requestId: string): string {
  const t = requestId.trim();
  return t.length >= 8 ? t.slice(0, 8) : t || '?';
}

/**
 * Single-line logs for POST /api/maintenance/enrollments.
 * OK / FAIL / ERROR + reason + req id. No tokens, URLs, or account identifiers.
 */
export function logMaintenanceEnrollmentPost(
  requestId: string,
  level: MaintenanceEnrollmentLogLevel,
  reason: string,
  meta?: Record<string, unknown>
): void {
  const outcome =
    level === 'info' ? 'OK' : level === 'warn' ? 'FAIL' : 'ERROR';
  const parts = [
    ROUTE_PREFIX,
    outcome,
    reason,
    `req=${shortRequestIdForLog(requestId)}`,
  ];

  if (meta) {
    for (const [key, value] of Object.entries(meta)) {
      if (value === undefined || value === null || !ALLOWED_LOG_META.has(key)) {
        continue;
      }
      parts.push(`${key}=${String(value)}`);
    }
  }

  const line = parts.join(' ');
  if (level === 'info') console.info(line);
  else if (level === 'warn') console.warn(line);
  else console.error(line);
}

export function supabaseErrorForLogs(
  error: { code?: string; message?: string } | null | undefined
): Record<string, unknown> {
  if (!error?.code) return {};
  return { supabaseCode: error.code };
}

export function maintenanceEnrollmentJsonResponse(
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
