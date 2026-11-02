/**
 * In-app + Expo push digest for unanswered public quote requests.
 * Insert-first so cron retries do not send a second push.
 * Skips the day if they already got a new-request ping (no stacked spam).
 * Tap opens the quotes screen (no quote id).
 */

import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  QUOTE_REQUEST_FOLLOW_UP_INBOX_REFERENCE_ID,
  QUOTE_REQUEST_FOLLOW_UP_REFERENCE_ID,
  QUOTE_REQUEST_FOLLOW_UP_REFERENCE_TYPE,
  QUOTE_REQUEST_FOLLOW_UP_TYPE,
  QUOTE_REQUEST_STALE_AFTER_MS,
} from './constants';
import {
  quoteRequestFollowUpBody,
  quoteRequestFollowUpDedupeKey,
  quoteRequestFollowUpTitle,
} from './quoteRequestFollowUpCopy';

const UNIQUE_VIOLATION = '23505';

export type QuoteRequestFollowUpNotifyResult =
  | 'sent'
  | 'duplicate'
  | 'skipped'
  | 'failed';

function postgresErrorCode(error: unknown): string {
  if (
    typeof error === 'object' &&
    error &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  ) {
    return (error as { code: string }).code;
  }
  return '';
}

function sanitizedWaitingCount(value: number): number {
  const count = Math.floor(Number(value));
  if (!Number.isFinite(count) || count < 1) return 0;
  return count;
}

async function ownerAlreadyGotNewQuotePing(
  supabase: SupabaseClient,
  profileId: string,
  now: Date
): Promise<boolean> {
  const sinceIso = new Date(
    now.getTime() - QUOTE_REQUEST_STALE_AFTER_MS
  ).toISOString();

  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', profileId)
    .eq('type', 'quote_request')
    .gte('created_at', sinceIso)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[quote-request-follow-up] recent new-request lookup failed', {
      profileId,
      message: error.message,
    });
    return false;
  }

  return Boolean(data);
}

export async function notifyOwnerForQuoteRequestFollowUp(
  supabase: SupabaseClient,
  params: {
    profileId: string;
    count: number;
    localDateYmd: string;
    now?: Date;
  }
): Promise<QuoteRequestFollowUpNotifyResult> {
  const profileId = params.profileId.trim();
  const localDateYmd = params.localDateYmd.trim();
  const count = sanitizedWaitingCount(params.count);
  if (!profileId || !localDateYmd || count < 1) {
    return 'skipped';
  }

  const now = params.now ?? new Date();
  if (await ownerAlreadyGotNewQuotePing(supabase, profileId, now)) {
    return 'skipped';
  }

  const title = quoteRequestFollowUpTitle();
  const bodyText = quoteRequestFollowUpBody(count);
  const dedupeKey = quoteRequestFollowUpDedupeKey(profileId, localDateYmd);

  const { error: notifError } = await supabase.from('notifications').insert({
    user_id: profileId,
    type: QUOTE_REQUEST_FOLLOW_UP_TYPE,
    reference_type: QUOTE_REQUEST_FOLLOW_UP_REFERENCE_TYPE,
    reference_id: QUOTE_REQUEST_FOLLOW_UP_INBOX_REFERENCE_ID,
    title,
    body: bodyText,
    dedupe_key: dedupeKey,
    metadata: {
      reference_type: QUOTE_REQUEST_FOLLOW_UP_REFERENCE_TYPE,
      reference_id: QUOTE_REQUEST_FOLLOW_UP_REFERENCE_ID,
    },
  } as never);

  if (notifError) {
    if (postgresErrorCode(notifError) === UNIQUE_VIOLATION) {
      return 'duplicate';
    }
    console.warn('[quote-request-follow-up] notification insert failed', {
      profileId,
      message: notifError.message,
    });
    return 'failed';
  }

  await sendExpoPushToUser(supabase, {
    userId: profileId,
    title,
    body: bodyText,
    data: {
      reference_type: QUOTE_REQUEST_FOLLOW_UP_REFERENCE_TYPE,
      reference_id: QUOTE_REQUEST_FOLLOW_UP_REFERENCE_ID,
    },
  });

  return 'sent';
}
