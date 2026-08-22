/**
 * Find owners with confirmed bookings scheduled for “tomorrow” and remind
 * each owner once. Tap opens the bookings / calendar screen.
 */

import { logAvailabilityOwnerNotify } from '@/features/availability/server/availabilityOwnerNotifyLog';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  loadConfirmedReminderBookings,
  loadReminderBusinesses,
} from './loadConfirmedReminderBookings';
import { notifyOwnerForBookingReminder } from './notifyOwnerForBookingReminder';
import {
  BOOKING_REMINDER_TIMEZONE,
  bookingReminderTargetDate,
} from './ownerBookingReminderDate';

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
    dryRun?: boolean;
    onlyProfileId?: string | null;
  }
): Promise<OwnerBookingRemindersRunResult> {
  const now = params?.now ?? new Date();
  const timeZone = params?.timeZone ?? BOOKING_REMINDER_TIMEZONE;
  const correlationId = params?.correlationId ?? null;
  const targetDate = bookingReminderTargetDate(now, timeZone);

  const result: OwnerBookingRemindersRunResult = {
    targetDate,
    bookingsFound: 0,
    considered: 0,
    sent: 0,
    duplicate: 0,
    skipped: 0,
    failed: 0,
  };

  const bookings = await loadConfirmedReminderBookings(supabase, targetDate);
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

  const businesses = await loadReminderBusinesses(
    supabase,
    bookings.map(b => b.business_id)
  );

  const onlyProfileId = params?.onlyProfileId?.trim() || '';
  const ownerIds = [
    ...new Set([...businesses.values()].map(b => b.profileId).filter(Boolean)),
  ].filter(id => !onlyProfileId || id === onlyProfileId);
  result.considered = ownerIds.length;
  result.skipped = [...new Set(bookings.map(b => b.business_id))].filter(
    id => !businesses.has(id)
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
