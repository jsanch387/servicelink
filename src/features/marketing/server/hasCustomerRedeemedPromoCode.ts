import type { SupabaseClient } from '@supabase/supabase-js';
import {
  normalizeEmailForLookup,
  normalizePhoneForLookup,
} from '@/features/customer-management/server/normalizeCustomerContact';

/**
 * True when this customer already used the promo (redemption row or an
 * active/completed booking with that promo snapshot). Match: phone first, else email.
 */
export async function hasCustomerRedeemedPromoCode(
  db: SupabaseClient,
  params: {
    promoCodeId: string;
    customerPhone?: string | null;
    customerEmail?: string | null;
    /** When re-validating on reschedule, ignore this booking's own snapshot. */
    excludeBookingId?: string | null;
  }
): Promise<boolean> {
  const promoCodeId = params.promoCodeId?.trim();
  if (!promoCodeId) return false;

  const phone = normalizePhoneForLookup(params.customerPhone);
  const emailRaw = params.customerEmail?.trim() ?? '';
  const email = emailRaw ? normalizeEmailForLookup(emailRaw) : null;

  if (!phone && !email) return false;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const redemptions = (db as any).from('promo_code_redemptions');

    if (phone) {
      const { data, error } = await redemptions
        .select('id')
        .eq('promo_code_id', promoCodeId)
        .eq('customer_phone_normalized', phone)
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error(
          '[marketing] hasCustomerRedeemedPromoCode phone query failed',
          error
        );
      } else if (data?.id) {
        return true;
      }
    }

    if (email) {
      const { data, error } = await redemptions
        .select('id')
        .eq('promo_code_id', promoCodeId)
        .eq('customer_email_normalized', email)
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error(
          '[marketing] hasCustomerRedeemedPromoCode email query failed',
          error
        );
      } else if (data?.id) {
        return true;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let bookingQuery = (db as any)
      .from('bookings')
      .select('id, customer_phone, customer_email')
      .eq('discount_promo_code_id', promoCodeId)
      .neq('status', 'cancelled')
      .limit(200);

    const excludeBookingId = params.excludeBookingId?.trim();
    if (excludeBookingId) {
      bookingQuery = bookingQuery.neq('id', excludeBookingId);
    }

    const { data: bookingRows, error: bookingError } = await bookingQuery;

    if (bookingError) {
      console.error(
        '[marketing] hasCustomerRedeemedPromoCode bookings query failed',
        bookingError
      );
      return false;
    }

    for (const row of (bookingRows ?? []) as {
      customer_phone?: string | null;
      customer_email?: string | null;
    }[]) {
      if (phone && normalizePhoneForLookup(row.customer_phone) === phone) {
        return true;
      }
      if (
        email &&
        row.customer_email?.trim() &&
        normalizeEmailForLookup(row.customer_email) === email
      ) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('[marketing] hasCustomerRedeemedPromoCode failed', err);
    return false;
  }
}
