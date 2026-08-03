/**
 * POST /api/internal/sms/test
 *
 * Local smoke-test only: send one SMS via Telnyx.
 * Disabled outside `next dev` (NODE_ENV !== 'development').
 *
 * Body: { "to": "+15551234567", "message"?: "optional text" }
 */

import {
  getTelnyxClient,
  getTelnyxFromNumber,
} from '@/features/sms/services/telnyxClient';
import { toE164 } from '@/features/sms/utils/toE164';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_MESSAGE =
  'ServiceLink Telnyx test — if you got this, outbound SMS is working.';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const toRaw =
    body &&
    typeof body === 'object' &&
    'to' in body &&
    typeof (body as { to: unknown }).to === 'string'
      ? (body as { to: string }).to
      : null;

  const messageRaw =
    body &&
    typeof body === 'object' &&
    'message' in body &&
    typeof (body as { message: unknown }).message === 'string'
      ? (body as { message: string }).message.trim()
      : '';

  if (!toRaw?.trim()) {
    return NextResponse.json(
      { error: 'Missing "to" phone number (E.164 or 10-digit US).' },
      { status: 400 }
    );
  }

  const to = toE164(toRaw);
  if (!to) {
    return NextResponse.json(
      { error: 'Invalid "to" phone number; could not normalize to E.164.' },
      { status: 400 }
    );
  }

  const client = getTelnyxClient();
  const from = getTelnyxFromNumber();
  if (!client || !from) {
    return NextResponse.json(
      {
        error:
          'Telnyx not configured. Set TELNYX_API_KEY and TELNYX_FROM_NUMBER in .env.local.',
      },
      { status: 503 }
    );
  }

  const text = messageRaw || DEFAULT_MESSAGE;

  try {
    const response = await client.messages.send({
      from,
      to,
      text,
      type: 'SMS',
    });

    const id = response.data?.id ?? null;
    return NextResponse.json({
      ok: true,
      to,
      from,
      messageId: id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message.slice(0, 300) : String(e);
    return NextResponse.json(
      { ok: false, error: 'Telnyx send failed', detail: message },
      { status: 502 }
    );
  }
}
