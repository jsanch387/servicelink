/**
 * POST /api/internal/push/broadcast
 *
 * Server-to-server: sends a push to every registered Expo device token.
 * Pass `testEmail` to send only to that user's devices (for testing).
 * Authenticate with header `x-internal-push-secret` matching env INTERNAL_PUSH_API_SECRET.
 */

import { findAuthUserIdByEmail } from '@/features/account/server/updateAccountEmailAdmin';
import {
  assertInternalPushBroadcastProbeRateLimit,
  assertInternalPushFullBroadcastRateLimit,
} from '@/features/push/server/internalPushBroadcastRateLimit';
import { parseInternalPushBroadcastBody } from '@/features/push/server/internalPushBroadcastParse';
import {
  sendExpoPushBroadcast,
  sendExpoPushToUser,
} from '@/features/push/server/sendExpoPushToUser';
import { verifyInternalPushSecret } from '@/features/push/server/internalPushSecret';
import { logInternalPushSend } from '@/features/push/server/pushTransactionLog';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { assertReasonableJsonBodySize } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest, NextResponse } from 'next/server';

const MAX_BODY_BYTES = 8 * 1024;

export async function POST(request: NextRequest) {
  const probeLimited = await assertInternalPushBroadcastProbeRateLimit(request);
  if (!probeLimited.ok) {
    logInternalPushSend('warn', 'broadcast_rate_limited', {});
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(probeLimited.retryAfterSec),
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  const auth = verifyInternalPushSecret(request);
  if (auth === 'not_configured') {
    logInternalPushSend('warn', 'broadcast_not_configured', {});
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  if (auth === 'unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tooLarge = assertReasonableJsonBodySize(request, MAX_BODY_BYTES);
  if (tooLarge) return tooLarge;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    logInternalPushSend('warn', 'broadcast_invalid_json', {});
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = parseInternalPushBroadcastBody(json);
  if (!parsed) {
    logInternalPushSend('warn', 'broadcast_invalid_body', {});
    return NextResponse.json(
      {
        error:
          'Invalid body; expected { title, body?, testEmail?, data: { reference_type, reference_id } }',
      },
      { status: 400 }
    );
  }

  if (!parsed.testEmail) {
    const fullBroadcastLimit =
      await assertInternalPushFullBroadcastRateLimit(request);
    if (!fullBroadcastLimit.ok) {
      logInternalPushSend('warn', 'broadcast_full_rate_limited', {});
      return NextResponse.json(
        {
          error:
            'Full broadcast rate limit reached. Use testEmail for QA or try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(fullBroadcastLimit.retryAfterSec),
            'Cache-Control': 'no-store',
          },
        }
      );
    }
  }

  try {
    const admin = createSupabaseAdminClient();

    if (parsed.testEmail) {
      const userId = await findAuthUserIdByEmail(parsed.testEmail);
      if (!userId) {
        logInternalPushSend('warn', 'broadcast_test_user_not_found', {});
        return NextResponse.json(
          { error: 'No user found for testEmail' },
          { status: 404 }
        );
      }

      const { count, error: countError } = await admin
        .from('user_push_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        logInternalPushSend('warn', 'broadcast_test_token_count_failed', {
          userId,
          message: countError.message,
        });
      }

      await sendExpoPushToUser(admin, {
        userId,
        title: parsed.title,
        body: parsed.body,
        data: parsed.data,
      });

      const tokenCount = count ?? 0;
      logInternalPushSend('info', 'broadcast_test_completed', {
        userId,
        reference_type: parsed.data.reference_type,
        reference_id: parsed.data.reference_id,
        tokenCount,
      });

      return NextResponse.json({
        ok: true,
        testMode: true,
        tokenCount,
        messageCount: tokenCount,
      });
    }

    const result = await sendExpoPushBroadcast(admin, parsed);
    logInternalPushSend('info', 'broadcast_completed', {
      tokenCount: result.tokenCount,
      messageCount: result.messageCount,
      reference_type: parsed.data.reference_type,
      reference_id: parsed.data.reference_id,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logInternalPushSend('error', 'broadcast_internal_error', {
      message: e instanceof Error ? e.message.slice(0, 200) : String(e),
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
