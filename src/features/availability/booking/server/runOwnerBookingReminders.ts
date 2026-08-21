/**
 * Find owners with confirmed bookings scheduled for “tomorrow” and remind
 * each owner once. Tap opens the bookings / calendar screen.
 */

import { logAvailabilityOwnerNotify } from '@/features/availability/server/availabilityOwnerNotifyLog';
import type { Database } from '@/libs/supabase/client';
import { supabaseErrorForLogs } from '@/server/logging/structuredLog';
import type { SupabaseClient } from '@supabase/supabase-js';
import { notifyOwnerForBookingReminder } from './notifyOwnerForBookingReminder';
import {
  OWNER_BOOKING_REMINDER_TIMEZONE,
  ownerBookingReminderTargetDate,
} from './ownerBookingReminderDate';

const PAGE_SIZE = 200;

type ReminderBookingRow = {
  business_id: string;
};

export type OwnerBookingRemindersRunResult = {
  targetDate: string;
  bookingsFound: number;
  considered: number;
  sent: number;
  duplicate: number;
  skipped: number;
  failed: number;
};

export async function runOwnerBookingReminders(
  supabase: SupabaseClient<Database>,
  params?: {
    now?: Date;
    timeZone?: string;
    correlationId?: string | null;
    /** Count owners but do not insert or push. */
    dryRun?: boolean;
    /** If set, only this owner is notified. */
    onlyProfileId?: string | null;
  }
): Promise<OwnerBookingRemindersRunResult> {
  const now = params?.now ?? new Date();
  const timeZone = params?.timeZone ?? OWNER_BOOKING_REMINDER_TIMEZONE;
  const correlationId = params?.correlationId ?? null;
  const targetDate = ownerBookingReminderTargetDate(now, timeZone);

  const result: OwnerBookingRemindersRunResult = {
    targetDate,
    bookingsFound: 0,
    considered: 0,
    sent: 0,
    duplicate: 0,
    skipped: 0,
    failed: 0,
  };

  const bookings = await loadConfirmedBookingsForDate(supabase, targetDate);
  if (bookings === null) {
    logAvailabilityOwnerNotify(
      correlationId ?? undefined,
      'warn',
      'reminder_bookings_query_failed',
      { targetDate }
    );
    return result;
  }

  result.bookingsFound = bookings.length;
  if (bookings.length === 0) {
    return result;
  }

  const profileByBusinessId = await loadOwnerProfileIds(
    supabase,
    bookings.map(b => b.business_id)
  );

  const onlyProfileId = params?.onlyProfileId?.trim() || '';
  const ownerIds = [
    ...new Set(
      [...profileByBusinessId.values()].map(id => id.trim()).filter(Boolean)
    ),
  ].filter(id => !onlyProfileId || id === onlyProfileId);
  result.considered = ownerIds.length;
  result.skipped = [...new Set(bookings.map(b => b.business_id))].filter(
    id => !profileByBusinessId.has(id)
  ).length;
  if (onlyProfileId && ownerIds.length === 0) {
    result.skipped += 1;
  }

  if (params?.dryRun) {
    logAvailabilityOwnerNotify(
      correlationId ?? undefined,
      'info',
      'reminder_run_dry',
      { ...result }
    );
    return result;
  }

  for (const profileId of ownerIds) {
    const outcome = await notifyOwnerForBookingReminder(supabase, {
      profileId,
      targetDate,
      correlationId,
    });
    result[outcome] += 1;
  }

  logAvailabilityOwnerNotify(
    correlationId ?? undefined,
    'info',
    'reminder_run_complete',
    { ...result }
  );

  return result;
}

async function loadConfirmedBookingsForDate(
  supabase: SupabaseClient<Database>,
  scheduledDate: string
): Promise<ReminderBookingRow[] | null> {
  const rows: ReminderBookingRow[] = [];
  let offset = 0;

  // `bookings` is not in the generated Database type yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  while (true) {
    const { data, error } = await db
      .from('bookings')
      .select('business_id')
      .eq('status', 'confirmed')
      .eq('scheduled_date', scheduledDate)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      logAvailabilityOwnerNotify(
        undefined,
        'warn',
        'reminder_bookings_page_failed',
        {
          scheduledDate,
          offset,
          ...supabaseErrorForLogs(error),
        }
      );
      return null;
    }

    const page = (data ?? []) as ReminderBookingRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }

  return rows;
}

async function loadOwnerProfileIds(
  supabase: SupabaseClient<Database>,
  businessIds: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(businessIds.map(id => id.trim()).filter(Boolean))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const { data, error } = await supabase
    .from('business_profiles')
    .select('id, profile_id')
    .in('id', unique);

  if (error) {
    logAvailabilityOwnerNotify(
      undefined,
      'warn',
      'reminder_owners_query_failed',
      {
        ...supabaseErrorForLogs(error),
      }
    );
    return map;
  }

  for (const row of data ?? []) {
    const id = row.id?.trim();
    const profileId = row.profile_id?.trim();
    if (id && profileId) {
      map.set(id, profileId);
    }
  }

  return map;
}
