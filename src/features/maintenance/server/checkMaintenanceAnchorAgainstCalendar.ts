/**
 * Validates a maintenance first-visit anchor against owner time-off and existing
 * confirmed/completed bookings (same rules as the public booking overlap checks).
 */

import { validateOwnerBookingSlot } from '@/features/availability/booking/server/validateOwnerBookingSlot';
import type { OwnerBookingSlotValidationCode } from '@/features/availability/booking/server/validateOwnerBookingSlot';
import { quoteStartTimeToHHmm } from '@/features/quotes/server/createBookingFromApprovedQuote';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type MaintenanceAnchorCalendarConflict =
  | 'time_off_conflict'
  | 'existing_booking_conflict'
  | 'load_bookings_failed';

const SLOT_CODE_TO_MAINTENANCE: Record<
  OwnerBookingSlotValidationCode,
  MaintenanceAnchorCalendarConflict
> = {
  time_off_conflict: 'time_off_conflict',
  existing_booking_conflict: 'existing_booking_conflict',
  load_bookings_failed: 'load_bookings_failed',
  outside_weekly_hours: 'existing_booking_conflict',
  availability_not_configured: 'existing_booking_conflict',
};

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
    const slot = await validateOwnerBookingSlot(supabase, {
      businessId: params.businessId,
      scheduledDate,
      startTimeHHmm: startTime,
      durationMinutes,
      excludeBookingId: params.excludeBookingId,
    });
    if (!slot.ok) {
      return {
        ok: false,
        reason: SLOT_CODE_TO_MAINTENANCE[slot.code],
      };
    }

    return { ok: true };
  } catch (e) {
    console.error('[maintenance] slot check failed', e);
    return { ok: false, reason: 'load_bookings_failed' };
  }
}
