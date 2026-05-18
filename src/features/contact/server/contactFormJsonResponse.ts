import { NextResponse } from 'next/server';
import type { ContactFormApiErrorCode } from '../types';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export function contactFormJsonResponse(
  body:
    | { success: true }
    | { success: false; error: string; code: ContactFormApiErrorCode },
  status: number,
  extraHeaders?: Record<string, string>
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { ...NO_STORE, ...extraHeaders },
  });
}
