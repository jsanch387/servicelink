/**
 * In-app + Expo push for a day-before owner booking reminder.
 * Insert-first so cron retries do not send a second push.
 * Tap opens the bookings / calendar screen (no booking id).
 */

import { logAvailabilityOwnerNotify } from '@/features/availability/server/availabilityOwnerNotifyLog';
import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';
import type { Database } from '@/libs/supabase/client';
import { supabaseErrorForLogs } from '@/server/logging/structuredLog';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  OWNER_BOOKING_REMINDER_INBOX_REFERENCE_ID,
  OWNER_BOOKING_REMINDER_REFERENCE_ID,
  OWNER_BOOKING_REMINDER_REFERENCE_TYPE,
  OWNER_BOOKING_REMINDER_TYPE,
  ownerBookingReminderBody,
  ownerBookingReminderDedupeKey,
  ownerBookingReminderTitle,
} from './ownerBookingReminderCopy';

const UNIQUE_VIOLATION = '23505';

export type OwnerBookingReminderNotifyResult =
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

export async function notifyOwnerForBookingReminder(
  supabase: SupabaseClient<Database>,
  params: {
    profileId: string | null;
    targetDate: string;
    correlationId?: string | null;
  }
): Promise<OwnerBookingReminderNotifyResult> {
  const profileId = params.profileId?.trim() || '';
  const targetDate = params.targetDate.trim();
  if (!profileId || !targetDate) {
    logAvailabilityOwnerNotify(
      params.correlationId ?? undefined,
      'warn',
      'reminder_skip',
      {
        reason: !profileId ? 'no_owner_profile' : 'missing_target_date',
      }
    );
    return 'skipped';
  }

  const title = ownerBookingReminderTitle();
  const bodyText = ownerBookingReminderBody();
  const dedupeKey = ownerBookingReminderDedupeKey(profileId, targetDate);

  const { error: notifError } = await supabase.from('notifications').insert({
    user_id: profileId,
    type: OWNER_BOOKING_REMINDER_TYPE,
    reference_type: OWNER_BOOKING_REMINDER_REFERENCE_TYPE,
    reference_id: OWNER_BOOKING_REMINDER_INBOX_REFERENCE_ID,
    title,
    body: bodyText,
    dedupe_key: dedupeKey,
    metadata: {
      reference_type: OWNER_BOOKING_REMINDER_REFERENCE_TYPE,
      reference_id: OWNER_BOOKING_REMINDER_REFERENCE_ID,
    },
  } as never);

  if (notifError) {
    if (postgresErrorCode(notifError) === UNIQUE_VIOLATION) {
      return 'duplicate';
    }
    logAvailabilityOwnerNotify(
      params.correlationId ?? undefined,
      'warn',
      'reminder_notification_failed',
      { profileId, ...supabaseErrorForLogs(notifError) }
    );
    return 'failed';
  }

  await sendExpoPushToUser(supabase, {
    userId: profileId,
    title,
    body: bodyText,
    data: {
      reference_type: OWNER_BOOKING_REMINDER_REFERENCE_TYPE,
      reference_id: OWNER_BOOKING_REMINDER_REFERENCE_ID,
    },
  });

  return 'sent';
}
