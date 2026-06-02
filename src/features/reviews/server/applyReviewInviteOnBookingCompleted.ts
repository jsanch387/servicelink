import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createReviewInviteIfEligible } from './createReviewInviteIfEligible';

/**
 * Post-completion hook: review invite email (best-effort).
 */
export async function applyReviewInviteOnBookingCompleted(
  supabase: SupabaseClient,
  booking: BookingRow
): Promise<void> {
  try {
    const result = await createReviewInviteIfEligible(supabase, booking);
    if (!result.ok) {
      console.error(
        '[reviews] applyReviewInviteOnBookingCompleted',
        result.error
      );
      return;
    }
    if ('skipped' in result && result.skipped) {
      return;
    }
    if ('sent' in result && !result.sent) {
      console.warn(
        '[reviews] invite created but email not sent',
        result.inviteId
      );
    }
  } catch (err) {
    console.error('[reviews] applyReviewInviteOnBookingCompleted', err);
  }
}
