/**
 * Email + SMS customers with confirmed bookings scheduled for “tomorrow”.
 */

import { logAvailabilityOwnerNotify } from '@/features/availability/server/availabilityOwnerNotifyLog';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BOOKING_REMINDER_SEND_CONCURRENCY } from './constants';
import {
  loadConfirmedReminderBookings,
  loadReminderBusinesses,
  type ReminderBookingRow,
} from './loadConfirmedReminderBookings';
import { mapWithConcurrency } from './mapWithConcurrency';
import { notifyCustomerForBookingReminder } from './notifyCustomerForBookingReminder';
import {
  BOOKING_REMINDER_TIMEZONE,
  bookingReminderTargetDate,
} from './ownerBookingReminderDate';

export type CustomerBookingRemindersRunResult = {
  targetDate: string;
  bookingsFound: number;
  considered: number;
  emailSent: number;
  smsSent: number;
  skipped: number;
  failed: number;
};

export async function runCustomerBookingReminders(
  supabase: SupabaseClient<Database>,
  params?: {
    now?: Date;
    timeZone?: string;
    correlationId?: string | null;
    dryRun?: boolean;
    onlyCustomerEmail?: string | null;
  }
): Promise<CustomerBookingRemindersRunResult> {
  const now = params?.now ?? new Date();
  const timeZone = params?.timeZone ?? BOOKING_REMINDER_TIMEZONE;
  const correlationId = params?.correlationId ?? null;
  const targetDate = bookingReminderTargetDate(now, timeZone);
  const onlyCustomerEmail =
    params?.onlyCustomerEmail?.trim().toLowerCase() || '';

  const result: CustomerBookingRemindersRunResult = {
    targetDate,
    bookingsFound: 0,
    considered: 0,
    emailSent: 0,
    smsSent: 0,
    skipped: 0,
    failed: 0,
  };

  const bookings = await loadConfirmedReminderBookings(supabase, targetDate);
  if (bookings === null) {
    logAvailabilityOwnerNotify(
      correlationId ?? undefined,
      'warn',
      'customer_reminder_bookings_query_failed',
      { targetDate }
    );
    return result;
  }

  const filtered = onlyCustomerEmail
    ? bookings.filter(
        b => (b.customer_email ?? '').trim().toLowerCase() === onlyCustomerEmail
      )
    : bookings;

  result.bookingsFound = filtered.length;
  const businesses = await loadReminderBusinesses(
    supabase,
    filtered.map(b => b.business_id)
  );

  const toNotify: ReminderBookingRow[] = [];
  for (const booking of filtered) {
    const hasEmail = Boolean(booking.customer_email?.trim());
    const hasPhone = Boolean(booking.customer_phone?.trim());
    if (!hasEmail && !hasPhone) {
      result.skipped += 1;
      continue;
    }

    result.considered += 1;
    if (!params?.dryRun) {
      toNotify.push(booking);
    }
  }

  const outcomes = await mapWithConcurrency(
    toNotify,
    BOOKING_REMINDER_SEND_CONCURRENCY,
    booking =>
      notifyCustomerForBookingReminder(supabase, {
        bookingId: booking.id,
        businessId: booking.business_id,
        businessName: businesses.get(booking.business_id)?.businessName ?? '',
        scheduledDate: booking.scheduled_date,
        startTime: booking.start_time,
        serviceName: booking.service_name,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone,
        customerId: booking.customer_id,
        correlationId,
      })
  );

  for (const outcome of outcomes) {
    if (outcome.email === 'sent') result.emailSent += 1;
    if (outcome.sms === 'sent') result.smsSent += 1;
    if (outcome.email === 'failed' || outcome.sms === 'failed') {
      result.failed += 1;
    }
  }

  logAvailabilityOwnerNotify(
    correlationId ?? undefined,
    'info',
    params?.dryRun
      ? 'customer_reminder_run_dry'
      : 'customer_reminder_run_complete',
    { ...result }
  );

  return result;
}
