import crypto from 'crypto';
import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import type { SupabaseClient } from '@supabase/supabase-js';

const INVITE_EXPIRY_DAYS = 90;

export type EnsureReviewInviteRecordResult =
  | {
      ok: true;
      skipped: false;
      inviteId: string;
      rawReviewToken: string;
    }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

async function hasExistingReviewForCustomer(
  supabase: SupabaseClient,
  businessId: string,
  customerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id')
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
}

async function findInviteByBookingId(
  supabase: SupabaseClient,
  bookingId: string
): Promise<{ id: string } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('review_invites')
    .select('id')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error) throw error;
  return data ? { id: String(data.id) } : null;
}

function expiresAtFromNow(): string {
  const d = new Date();
  d.setDate(d.getDate() + INVITE_EXPIRY_DAYS);
  return d.toISOString();
}

async function hasPendingInviteForCustomer(
  supabase: SupabaseClient,
  businessId: string,
  customerId: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('review_invites')
    .select('id')
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
}

/**
 * Creates a review invite row when eligible — no SMS/email. Used by job_completed
 * so the invoice page can surface a review CTA without a separate mobile POST.
 */
export async function ensureReviewInviteRecordIfEligible(
  supabase: SupabaseClient,
  booking: Pick<BookingRow, 'id' | 'business_id' | 'customer_id'>
): Promise<EnsureReviewInviteRecordResult> {
  const bookingId = booking.id?.trim();
  const businessId = booking.business_id?.trim();
  const customerId = booking.customer_id?.trim() ?? '';

  if (!bookingId || !businessId) {
    return { ok: false, error: 'Invalid booking context' };
  }

  if (!customerId) {
    return { ok: true, skipped: true, reason: 'no_customer_id' };
  }

  const existingInvite = await findInviteByBookingId(supabase, bookingId);
  if (existingInvite) {
    return { ok: true, skipped: true, reason: 'invite_already_exists' };
  }

  if (await hasExistingReviewForCustomer(supabase, businessId, customerId)) {
    return { ok: true, skipped: true, reason: 'customer_already_reviewed' };
  }

  if (await hasPendingInviteForCustomer(supabase, businessId, customerId)) {
    return { ok: true, skipped: true, reason: 'pending_invite_exists' };
  }

  const rawToken = crypto.randomBytes(32).toString('base64url');
  const linkTokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: insertError } = await (supabase as any)
    .from('review_invites')
    .insert({
      business_id: businessId,
      booking_id: bookingId,
      customer_id: customerId,
      link_token_hash: linkTokenHash,
      status: 'pending',
      expires_at: expiresAtFromNow(),
    })
    .select('id')
    .single();

  if (insertError || !inserted?.id) {
    return {
      ok: false,
      error: insertError?.message ?? 'Failed to create review invite',
    };
  }

  return {
    ok: true,
    skipped: false,
    inviteId: String(inserted.id),
    rawReviewToken: rawToken,
  };
}
