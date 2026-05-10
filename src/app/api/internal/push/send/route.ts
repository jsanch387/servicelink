/**
 * POST /api/internal/push/send
 *
 * Server-to-server: loads Expo tokens for `userId` and sends a push.
 * Authenticate with header `x-internal-push-secret` matching env INTERNAL_PUSH_API_SECRET.
 */

import { parseInternalPushSendBody } from '@/features/push/server/internalPushSendParse';
import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';
import { logInternalPushSend } from '@/features/push/server/pushTransactionLog';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.INTERNAL_PUSH_API_SECRET?.trim();
  if (!configuredSecret) {
    logInternalPushSend('warn', 'not_configured', {});
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const provided = request.headers.get('x-internal-push-secret') ?? '';
  if (!constantTimeEqual(provided, configuredSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    logInternalPushSend('warn', 'invalid_json', {});
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = parseInternalPushSendBody(json);
  if (!parsed) {
    logInternalPushSend('warn', 'invalid_body', {});
    return NextResponse.json(
      {
        error:
          'Invalid body; expected { userId, title, body?, data: { reference_type, reference_id } }',
      },
      { status: 400 }
    );
  }

  try {
    const admin = createSupabaseAdminClient();
    await sendExpoPushToUser(admin, parsed);
    logInternalPushSend('info', 'push_dispatched', {
      userId: parsed.userId,
      reference_type: parsed.data.reference_type,
    });
  } catch (e) {
    logInternalPushSend('error', 'internal_error', {
      message: e instanceof Error ? e.message.slice(0, 200) : String(e),
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
