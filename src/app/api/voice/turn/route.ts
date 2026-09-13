/**
 * POST /api/voice/turn
 *
 * Owner-only (same auth as owner-manual booking). Multipart `audio` + `draft`.
 * Listen → parse draft → Speak the next question.
 * Does not persist or create a booking.
 */

import { handleVoiceTurn } from '@/features/voice/server/handleVoiceTurn';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handleVoiceTurn(request);
}
