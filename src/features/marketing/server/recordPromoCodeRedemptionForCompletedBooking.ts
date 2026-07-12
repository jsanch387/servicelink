import type { SupabaseClient } from '@supabase/supabase-js';
import {
  normalizeEmailForLookup,
  normalizePhoneForLookup,
} from '@/features/customer-management/server/normalizeCustomerContact';

export type BookingPromoRedemptionInput = {
  id: string;
  business_id: string;
  discount_source?: string | null;
  discount_promo_code_id?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
};

/**
 * Inserts `promo_code_redemptions` when a promo-discounted booking is completed.
 * Idempotent per booking_id. Best-effort — never throws to callers.
 */
export async function recordPromoCodeRedemptionForCompletedBooking(
  db: SupabaseClient,
  booking: BookingPromoRedemptionInput
): Promise<{ recorded: boolean; reason?: string }> {
  try {
    if (booking.discount_source !== 'promo') {
      return { recorded: false, reason: 'not_promo' };
    }

    const promoCodeId = booking.discount_promo_code_id?.trim();
    const bookingId = booking.id?.trim();
    const businessId = booking.business_id?.trim();
    if (!promoCodeId || !bookingId || !businessId) {
      return { recorded: false, reason: 'missing_ids' };
    }

    const phone = normalizePhoneForLookup(booking.customer_phone);
    const emailRaw = booking.customer_email?.trim() ?? '';
    const email = emailRaw ? normalizeEmailForLookup(emailRaw) : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = (db as any).from('promo_code_redemptions');

    const { data: existing, error: existingError } = await table
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (existingError) {
      console.error(
        '[marketing] recordPromoCodeRedemption existing check failed',
        existingError
      );
      return { recorded: false, reason: 'lookup_failed' };
    }
    if (existing?.id) {
      return { recorded: false, reason: 'already_recorded' };
    }

    const { error: insertError } = await table.insert({
      promo_code_id: promoCodeId,
      booking_id: bookingId,
      business_id: businessId,
      customer_phone_normalized: phone,
      customer_email_normalized: email,
      redeemed_at: new Date().toISOString(),
    });

    if (insertError) {
      // Unique race / already redeemed constraints — treat as non-fatal.
      const code = String(insertError.code ?? '');
      if (code === '23505') {
        return { recorded: false, reason: 'duplicate' };
      }
      console.error(
        '[marketing] recordPromoCodeRedemption insert failed',
        insertError
      );
      return { recorded: false, reason: 'insert_failed' };
    }

    return { recorded: true };
  } catch (err) {
    console.error(
      '[marketing] recordPromoCodeRedemptionForCompletedBooking',
      err
    );
    return { recorded: false, reason: 'unexpected' };
  }
}
