import crypto from 'crypto';
import { getPublicReviewPath } from '@/constants/routes';
import { getAppBaseUrl } from '@/features/email/services/resendClient';
import type { SupabaseClient } from '@supabase/supabase-js';

const INVITE_EXPIRY_DAYS = 90;

export type ResolveAssistantReviewInviteUrlResult =
  | { ok: true; url: string; inviteId: string }
  | {
      ok: false;
      reason:
        | 'no_customer'
        | 'no_booking'
        | 'already_reviewed'
        | 'error';
      error?: string;
    };

function expiresAtFromNow(): string {
  const d = new Date();
  d.setDate(d.getDate() + INVITE_EXPIRY_DAYS);
  return d.toISOString();
}

function createInviteToken(): { rawToken: string; linkTokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const linkTokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  return { rawToken, linkTokenHash };
}

function publicUrlForToken(rawToken: string): string {
  return `${getAppBaseUrl()}${getPublicReviewPath(rawToken)}`;
}

/**
 * Mint a working review URL for Assistant follow-ups.
 *
 * Always rotates (or creates) the pending invite token so we can return a
 * raw URL — hashes alone are not reversible. Invalidates any older pending
 * link for that customer, same as job-complete reuse.
 */
export async function resolveAssistantReviewInviteUrl(
  admin: SupabaseClient,
  input: {
    businessId: string;
    customerId: string;
    bookingId: string | null | undefined;
  }
): Promise<ResolveAssistantReviewInviteUrlResult> {
  const businessId = input.businessId.trim();
  const customerId = input.customerId.trim();
  const bookingId = input.bookingId?.trim() || '';

  if (!customerId) {
    return { ok: false, reason: 'no_customer' };
  }
  if (!bookingId) {
    return { ok: false, reason: 'no_booking' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  try {
    const { data: existingReview, error: reviewError } = await db
      .from('reviews')
      .select('id')
      .eq('business_id', businessId)
      .eq('customer_id', customerId)
      .limit(1)
      .maybeSingle();

    if (reviewError) {
      return {
        ok: false,
        reason: 'error',
        error: reviewError.message ?? 'Failed to check reviews',
      };
    }
    if (existingReview?.id) {
      return { ok: false, reason: 'already_reviewed' };
    }

    const { data: pending, error: pendingError } = await db
      .from('review_invites')
      .select('id')
      .eq('business_id', businessId)
      .eq('customer_id', customerId)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle();

    if (pendingError) {
      return {
        ok: false,
        reason: 'error',
        error: pendingError.message ?? 'Failed to load review invite',
      };
    }

    const { rawToken, linkTokenHash } = createInviteToken();

    if (pending?.id) {
      const { data: refreshed, error: refreshError } = await db
        .from('review_invites')
        .update({
          link_token_hash: linkTokenHash,
          expires_at: expiresAtFromNow(),
          last_notification_error: null,
        })
        .eq('id', pending.id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle();

      if (refreshError) {
        return {
          ok: false,
          reason: 'error',
          error: refreshError.message ?? 'Failed to refresh review invite',
        };
      }
      if (!refreshed?.id) {
        return { ok: false, reason: 'already_reviewed' };
      }

      return {
        ok: true,
        inviteId: String(refreshed.id),
        url: publicUrlForToken(rawToken),
      };
    }

    const { data: byBooking, error: byBookingError } = await db
      .from('review_invites')
      .select('id, status')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (byBookingError) {
      return {
        ok: false,
        reason: 'error',
        error: byBookingError.message ?? 'Failed to load booking invite',
      };
    }

    if (byBooking?.id && byBooking.status === 'pending') {
      const { data: refreshed, error: refreshError } = await db
        .from('review_invites')
        .update({
          link_token_hash: linkTokenHash,
          expires_at: expiresAtFromNow(),
          last_notification_error: null,
        })
        .eq('id', byBooking.id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle();

      if (refreshError || !refreshed?.id) {
        return {
          ok: false,
          reason: 'error',
          error: refreshError?.message ?? 'Failed to refresh booking invite',
        };
      }

      return {
        ok: true,
        inviteId: String(refreshed.id),
        url: publicUrlForToken(rawToken),
      };
    }

    if (byBooking?.id) {
      // Invite for this booking exists but is no longer pending (submitted/expired).
      return { ok: false, reason: 'already_reviewed' };
    }

    const { data: inserted, error: insertError } = await db
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
        reason: 'error',
        error: insertError?.message ?? 'Failed to create review invite',
      };
    }

    return {
      ok: true,
      inviteId: String(inserted.id),
      url: publicUrlForToken(rawToken),
    };
  } catch (error) {
    return {
      ok: false,
      reason: 'error',
      error: error instanceof Error ? error.message : 'Failed to resolve review URL',
    };
  }
}

export { injectReviewUrlIntoBody } from '../utils/injectReviewUrlIntoBody';
