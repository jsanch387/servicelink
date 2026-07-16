/**
 * Server-only: validates a proposed booking slot for an owner action
 * (reschedule, etc.) against weekly hours, time off, and other bookings.
 */

import type { ExistingBooking } from '@/features/availability/booking/types';
import {
  bookingOverlapsExistingBookings,
  bookingOverlapsTimeOff,
  isSlotWithinWeeklyHours,
} from '@/features/availability/booking/utils/slotGeneration';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import {
  DEFAULT_SCHEDULE,
  type WeeklySchedule,
} from '@/features/availability/types/availability';
import { parseStoredTimeOffBlocks } from '@/features/availability/types/blockTime';
import { hasAvailabilityConfigured } from '@/features/availability/utils/hasAvailabilityConfigured';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type OwnerBookingSlotValidationCode =
  | 'availability_not_configured'
  | 'outside_weekly_hours'
  | 'time_off_conflict'
  | 'existing_booking_conflict'
  | 'load_bookings_failed';

export function ownerBookingSlotValidationMessage(
  code: OwnerBookingSlotValidationCode
): string {
  switch (code) {
    case 'availability_not_configured':
      return 'Set your weekly availability before rescheduling appointments.';
    case 'outside_weekly_hours':
      return 'That time is outside your working hours for that day. Pick another slot.';
    case 'time_off_conflict':
      return 'That time overlaps time you marked unavailable. Choose a different slot.';
    case 'existing_booking_conflict':
      return 'That time is already booked. Please pick another slot.';
    case 'load_bookings_failed':
    default:
      return 'We could not verify the calendar. Please try again in a moment.';
  }
}

/** Customer-facing messages for public quote accept / public booking checks. */
export function publicBookingSlotValidationMessage(
  code: OwnerBookingSlotValidationCode
): string {
  switch (code) {
    case 'availability_not_configured':
      return 'This business is not ready to take online bookings yet. Please contact them to schedule.';
    case 'outside_weekly_hours':
      return 'That time is outside the business’s available hours. Please pick another slot.';
    case 'time_off_conflict':
      return 'That time is no longer available. Please pick another slot.';
    case 'existing_booking_conflict':
      return 'That time was just booked. Please pick another slot.';
    case 'load_bookings_failed':
    default:
      return 'We could not verify availability. Please try again in a moment.';
  }
}

function coerceWeeklySchedule(raw: unknown): WeeklySchedule | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as WeeklySchedule;
}

export type ValidateOwnerBookingSlotParams = {
  businessId: string;
  scheduledDate: string;
  /** `HH:mm` 24h, e.g. `09:00` */
  startTimeHHmm: string;
  durationMinutes: number;
  /** When moving an existing booking, omit it from overlap checks. */
  excludeBookingId?: string | null;
};

/**
 * Loads availability + same-day bookings and checks weekly window, time off,
 * and double-booking (excluding `excludeBookingId` when set).
 */
export async function validateOwnerBookingSlot(
  supabase: SupabaseClient<Database>,
  params: ValidateOwnerBookingSlotParams
): Promise<{ ok: true } | { ok: false; code: OwnerBookingSlotValidationCode }> {
  const scheduledDate = params.scheduledDate.trim();
  const startTimeHHmm = params.startTimeHHmm.trim().slice(0, 5);
  const durationMinutes = Math.max(1, Math.round(params.durationMinutes));

  try {
    const availabilityRow = await getAvailabilityForBusiness(
      supabase,
      params.businessId
    );

    if (!hasAvailabilityConfigured(availabilityRow)) {
      return { ok: false, code: 'availability_not_configured' };
    }

    const weeklySchedule =
      coerceWeeklySchedule(availabilityRow?.weekly_schedule) ??
      DEFAULT_SCHEDULE;

    if (
      !isSlotWithinWeeklyHours(
        scheduledDate,
        startTimeHHmm,
        durationMinutes,
        weeklySchedule
      )
    ) {
      return { ok: false, code: 'outside_weekly_hours' };
    }

    const timeOffIntervals = parseStoredTimeOffBlocks(
      availabilityRow?.time_off_blocks
    );
    if (
      bookingOverlapsTimeOff(
        scheduledDate,
        startTimeHHmm,
        durationMinutes,
        timeOffIntervals
      )
    ) {
      return { ok: false, code: 'time_off_conflict' };
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
        '[validateOwnerBookingSlot] load same-day bookings',
        dayBookErr
      );
      return { ok: false, code: 'load_bookings_failed' };
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
        startTimeHHmm,
        durationMinutes,
        existingForOverlap
      )
    ) {
      return { ok: false, code: 'existing_booking_conflict' };
    }

    return { ok: true };
  } catch (e) {
    console.error('[validateOwnerBookingSlot]', e);
    return { ok: false, code: 'load_bookings_failed' };
  }
}
