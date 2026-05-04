/**
 * Validates a maintenance first-visit anchor against owner time-off and existing
 * confirmed/completed bookings (same rules as the public booking overlap checks).
 */

import type { ExistingBooking } from '@/features/availability/booking/types';
import {
  bookingOverlapsExistingBookings,
  bookingOverlapsTimeOff,
} from '@/features/availability/booking/utils/slotGeneration';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import { parseStoredTimeOffBlocks } from '@/features/availability/types/blockTime';
import { quoteStartTimeToHHmm } from '@/features/quotes/server/createBookingFromApprovedQuote';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type MaintenanceAnchorCalendarConflict =
  | 'time_off_conflict'
  | 'existing_booking_conflict'
  | 'load_bookings_failed';

export function maintenanceSlotAvailabilityUserMessage(
  reason: MaintenanceAnchorCalendarConflict
): string {
  if (
    reason === 'time_off_conflict' ||
    reason === 'existing_booking_conflict'
  ) {
    return 'That time is not available on the calendar. Please choose another date or time.';
  }
  return 'Could not verify calendar availability. Please try again.';
}

export async function checkMaintenanceAnchorAgainstCalendar(
  supabase: SupabaseClient<Database>,
  params: {
    businessId: string;
    anchorDate: string;
    anchorTime: string;
    durationMinutes: number;
    /** Exclude when re-validating an enrollment whose booking is being replaced. */
    excludeBookingId?: string | null;
  }
): Promise<
  { ok: true } | { ok: false; reason: MaintenanceAnchorCalendarConflict }
> {
  const scheduledDate = params.anchorDate.trim();
  const startTime = quoteStartTimeToHHmm(params.anchorTime);
  const durationMinutes = Math.max(1, Math.round(params.durationMinutes));

  try {
    const availabilityRow = await getAvailabilityForBusiness(
      supabase,
      params.businessId
    );
    const timeOffIntervals = parseStoredTimeOffBlocks(
      availabilityRow?.time_off_blocks
    );
    if (
      bookingOverlapsTimeOff(
        scheduledDate,
        startTime,
        durationMinutes,
        timeOffIntervals
      )
    ) {
      return { ok: false, reason: 'time_off_conflict' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: dayBookings, error: dayBookErr } = await db
      .from('bookings')
      .select('id, scheduled_date, start_time, duration_minutes')
      .eq('business_id', params.businessId)
      .eq('scheduled_date', scheduledDate)
      .in('status', ['confirmed', 'completed']);

    if (dayBookErr) {
      console.error(
        '[maintenance] slot check: load same-day bookings',
        dayBookErr
      );
      return { ok: false, reason: 'load_bookings_failed' };
    }

    const exclude = params.excludeBookingId?.trim() ?? '';
    const existingForOverlap: ExistingBooking[] = (dayBookings ?? [])
      .filter(
        (r: { id?: string }) =>
          !exclude || String(r.id ?? '').trim() !== exclude
      )
      .map(
        (r: {
          scheduled_date?: string;
          start_time?: string;
          duration_minutes?: number;
        }) => ({
          date: String(r.scheduled_date ?? '').trim(),
          startTime: String(r.start_time ?? '')
            .trim()
            .slice(0, 5),
          durationMinutes: Math.max(
            1,
            Math.round(Number(r.duration_minutes ?? 60))
          ),
        })
      );

    if (
      bookingOverlapsExistingBookings(
        scheduledDate,
        startTime,
        durationMinutes,
        existingForOverlap
      )
    ) {
      return { ok: false, reason: 'existing_booking_conflict' };
    }

    return { ok: true };
  } catch (e) {
    console.error('[maintenance] slot check failed', e);
    return { ok: false, reason: 'load_bookings_failed' };
  }
}
