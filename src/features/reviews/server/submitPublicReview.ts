import type { SupabaseClient } from '@supabase/supabase-js';
import { loadPublicReviewInviteByToken } from './loadPublicReviewInviteByToken';
import { notifyOwnerForReviewSubmitted } from './notifyOwnerForReviewSubmitted';
import type { SubmitReviewBody } from './validateSubmitReviewBody';
export type SubmitPublicReviewResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function submitPublicReview(
  supabase: SupabaseClient,
  body: SubmitReviewBody
): Promise<SubmitPublicReviewResult> {
  const loaded = await loadPublicReviewInviteByToken(supabase, body.token);
  if (!loaded.ok) {
    const status =
      loaded.reason === 'invalid_token'
        ? 400
        : loaded.reason === 'expired'
          ? 410
          : loaded.reason === 'already_submitted'
            ? 409
            : 404;
    const messages: Record<typeof loaded.reason, string> = {
      invalid_token: 'Invalid review link',
      not_found: 'Review link not found',
      expired: 'This review link has expired',
      already_submitted: 'You already submitted a review for this visit',
    };
    return { ok: false, status, error: messages[loaded.reason] };
  }

  const { context } = loaded;
  const authorName = context.customerDisplayName.trim().slice(0, 120);
  if (!authorName) {
    return {
      ok: false,
      status: 400,
      error: 'Invalid customer name on booking',
    };
  }

  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reviewRow, error: reviewError } = await (supabase as any)
    .from('reviews')
    .insert({
      business_id: context.businessId,
      booking_id: context.bookingId,
      review_invite_id: context.inviteId,
      customer_id: context.customerId,
      rating: body.rating,
      body: body.body,
      author_display_name: authorName,
      is_hidden: false,
    })
    .select('id')
    .single();

  if (reviewError) {
    console.error('[reviews] submitPublicReview insert failed', reviewError);
    const code = reviewError.code ?? '';
    if (code === '23505') {
      return {
        ok: false,
        status: 409,
        error: 'A review already exists for this visit or customer',
      };
    }
    return {
      ok: false,
      status: 500,
      error: reviewError.message || 'Failed to save review',
    };
  }

  const reviewId = String((reviewRow as { id?: string }).id ?? '').trim();
  if (!reviewId) {
    return {
      ok: false,
      status: 500,
      error: 'Review saved but id could not be read',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: inviteError } = await (supabase as any)
    .from('review_invites')
    .update({
      status: 'submitted',
      submitted_at: now,
    })
    .eq('id', context.inviteId)
    .eq('status', 'pending');

  if (inviteError) {
    console.error(
      '[reviews] submitPublicReview invite update failed',
      inviteError
    );
    return {
      ok: false,
      status: 500,
      error: 'Review saved but invite could not be finalized',
    };
  }

  try {
    await notifyOwnerForReviewSubmitted(supabase, {
      businessId: context.businessId,
      reviewId,
      customerName: authorName,
    });
  } catch {
    // Best-effort after successful submit
  }

  return { ok: true };
}
