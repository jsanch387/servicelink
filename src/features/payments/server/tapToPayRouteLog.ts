import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const REQUEST_ID_HEADERS = ['x-request-id', 'x-correlation-id'] as const;

export function getTapToPayRequestId(
  request: Pick<NextRequest, 'headers'>
): string {
  for (const name of REQUEST_ID_HEADERS) {
    const raw = request.headers.get(name)?.trim();
    if (raw) {
      return raw.slice(0, 128);
    }
  }
  return randomUUID();
}

export function tapToPayJsonResponse(
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
