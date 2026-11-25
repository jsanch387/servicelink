import {
  ASSISTANT_BETA_CHAT_TURN_LIMIT,
} from '@/features/assistant/constants/assistantBetaLimits';
import {
  getAssistantChatUsage,
  releaseAssistantChatTurn,
  reserveAssistantChatTurn,
  type AssistantChatUsage,
} from '@/features/assistant/server/assistantUsageMonth';
import { assertAssistantChatRateLimits } from '@/server/rateLimit/assistantChatRateLimit';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextResponse } from 'next/server';

export const ASSISTANT_CHAT_DISABLED_CODE = 'chat_disabled';
export const ASSISTANT_CHAT_LIMIT_CODE = 'chat_limit_reached';
export const ASSISTANT_CHAT_RATE_LIMIT_CODE = 'rate_limited';

export const ASSISTANT_CHAT_DISABLED_ERROR =
  'Ask is temporarily unavailable. Try again later.';

export const ASSISTANT_CHAT_LIMIT_ERROR =
  'You’ve used all Ask questions for this month. It resets next month.';

/** Global kill switch — set ASSISTANT_CHAT_DISABLED=1 (or true/yes/on). */
export function isAssistantChatDisabled(): boolean {
  const raw = process.env.ASSISTANT_CHAT_DISABLED?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

export function assistantChatDisabledResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: ASSISTANT_CHAT_DISABLED_ERROR,
      code: ASSISTANT_CHAT_DISABLED_CODE,
    },
    { status: 503 }
  );
}

export function assistantChatLimitResponse(
  usage: AssistantChatUsage
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: ASSISTANT_CHAT_LIMIT_ERROR,
      code: ASSISTANT_CHAT_LIMIT_CODE,
      usage: {
        yearMonth: usage.yearMonth,
        used: usage.used,
        limit: usage.limit ?? ASSISTANT_BETA_CHAT_TURN_LIMIT,
        remaining: usage.remaining,
      },
    },
    { status: 429 }
  );
}

export function assistantChatRateLimitResponse(
  retryAfterSec: number
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many questions right now. Wait a moment and try again.',
      code: ASSISTANT_CHAT_RATE_LIMIT_CODE,
      retryAfterSec,
    },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.max(1, retryAfterSec)) },
    }
  );
}

/**
 * Kill switch → short burst rate limit → monthly turn reserve.
 * On success, caller must stream the reply; on hard failure after reserve,
 * call `releaseReservedChatTurn`.
 */
export async function assertAssistantChatAllowed(input: {
  businessId: string;
  request: Request;
}): Promise<
  | { ok: true; usage: AssistantChatUsage; release: () => Promise<void> }
  | { ok: false; response: NextResponse }
> {
  if (isAssistantChatDisabled()) {
    return { ok: false, response: assistantChatDisabledResponse() };
  }

  const rate = await assertAssistantChatRateLimits(
    input.request,
    input.businessId
  );
  if (!rate.ok) {
    return {
      ok: false,
      response: assistantChatRateLimitResponse(rate.retryAfterSec),
    };
  }

  const admin = createSupabaseAdminClient();
  const reserved = await reserveAssistantChatTurn(admin, input.businessId);
  if (!reserved.ok) {
    return {
      ok: false,
      response: assistantChatLimitResponse(reserved.usage),
    };
  }

  return {
    ok: true,
    usage: reserved.usage,
    release: async () => {
      await releaseAssistantChatTurn(admin, input.businessId);
    },
  };
}

/** Read-only helper for tests / future UI meter. */
export async function peekAssistantChatUsage(
  businessId: string
): Promise<AssistantChatUsage> {
  return getAssistantChatUsage(createSupabaseAdminClient(), businessId);
}
