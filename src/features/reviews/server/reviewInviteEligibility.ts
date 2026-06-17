import { normalizedCustomerRecipientEmail } from '@/features/email/utils/normalizedCustomerRecipientEmail';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ReviewInviteEligibilityContext = {
  reviewedCustomerIds: Set<string>;
  pendingInviteCustomerIds: Set<string>;
  bookingIdsWithInvite: Set<string>;
};

export type BookingForReviewInviteEligibility = {
  id: string;
  customer_id: string | null;
  customer_email: string | null;
  customer_phone?: string | null;
};

export function willSendReviewInviteOnBookingComplete(
  booking: BookingForReviewInviteEligibility,
  context: ReviewInviteEligibilityContext
): boolean {
  const bookingId = booking.id?.trim();
  if (!bookingId) return false;

  // The invite is delivered SMS-first with an email fallback, so any reachable
  // channel (phone or email) makes the customer eligible.
  const hasEmail = Boolean(
    normalizedCustomerRecipientEmail(booking.customer_email ?? '')
  );
  const hasPhone = Boolean(booking.customer_phone?.trim());
  if (!hasEmail && !hasPhone) return false;

  const customerId = booking.customer_id?.trim() ?? '';
  if (!customerId) return false;

  if (context.bookingIdsWithInvite.has(bookingId)) return false;
  if (context.reviewedCustomerIds.has(customerId)) return false;
  if (context.pendingInviteCustomerIds.has(customerId)) return false;

  return true;
}

export function customerAlreadyReviewedForBooking(
  booking: Pick<BookingForReviewInviteEligibility, 'customer_id'>,
  context: ReviewInviteEligibilityContext
): boolean {
  const customerId = booking.customer_id?.trim() ?? '';
  if (!customerId) return false;
  return context.reviewedCustomerIds.has(customerId);
}

export async function loadReviewInviteEligibilityContext(
  supabase: SupabaseClient,
  businessId: string,
  bookings: BookingForReviewInviteEligibility[]
): Promise<ReviewInviteEligibilityContext> {
  const customerIds = [
    ...new Set(
      bookings
        .map(b => b.customer_id?.trim())
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const bookingIds = bookings.map(b => b.id).filter(Boolean);

  const reviewedCustomerIds = new Set<string>();
  const pendingInviteCustomerIds = new Set<string>();
  const bookingIdsWithInvite = new Set<string>();

  if (customerIds.length > 0) {
    const { data: reviewRows, error: reviewError } = await supabase
      .from('reviews')
      .select('customer_id')
      .eq('business_id', businessId)
      .in('customer_id', customerIds);

    if (reviewError) throw reviewError;

    for (const row of reviewRows ?? []) {
      const customerId = (row as { customer_id?: string }).customer_id;
      if (customerId) reviewedCustomerIds.add(customerId);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingRows, error: pendingError } = await (supabase as any)
      .from('review_invites')
      .select('customer_id')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .in('customer_id', customerIds);

    if (pendingError) throw pendingError;

    for (const row of pendingRows ?? []) {
      const customerId = (row as { customer_id?: string }).customer_id;
      if (customerId) pendingInviteCustomerIds.add(customerId);
    }
  }

  if (bookingIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inviteRows, error: inviteError } = await (supabase as any)
      .from('review_invites')
      .select('booking_id')
      .in('booking_id', bookingIds);

    if (inviteError) throw inviteError;

    for (const row of inviteRows ?? []) {
      const bookingId = (row as { booking_id?: string }).booking_id;
      if (bookingId) bookingIdsWithInvite.add(bookingId);
    }
  }

  return {
    reviewedCustomerIds,
    pendingInviteCustomerIds,
    bookingIdsWithInvite,
  };
}
