import { NextResponse } from 'next/server';
import type { VoiceTurnResponse } from '../types/voiceTurn';

const NO_STORE = { 'Cache-Control': 'no-store' };

export function voiceError(status: number, error: string): NextResponse {
  return NextResponse.json(
    { success: false, error },
    { status, headers: NO_STORE }
  );
}

export function voiceOk(body: VoiceTurnResponse): NextResponse {
  return NextResponse.json(body, { status: 200, headers: NO_STORE });
}
