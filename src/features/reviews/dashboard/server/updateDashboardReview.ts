import type { SupabaseClient } from '@supabase/supabase-js';
import type { DashboardReview } from '../types';
import {
  tryMapReviewRowToDashboardReview,
  type ReviewRowForDashboard,
} from './mapReviewRowToDashboardReview';
import type { UpdateReviewBody } from './validateUpdateReviewBody';

const REVIEW_SELECT =
  'id, author_display_name, rating, body, created_at, owner_reply_body, owner_replied_at, is_hidden';

export type UpdateDashboardReviewResult =
  | { ok: true; review: DashboardReview }
  | { ok: false; status: number; error: string };

/**
 * Set or clear owner reply. DB requires body + replied_at both set or both null.
 */
export async function updateDashboardReview(
  supabase: SupabaseClient,
  businessId: string,
  reviewId: string,
  patch: UpdateReviewBody
): Promise<UpdateDashboardReviewResult> {
  const trimmedBusinessId = businessId?.trim();
  const trimmedReviewId = reviewId?.trim();

  if (!trimmedBusinessId || !trimmedReviewId) {
    return {
      ok: false,
      status: 400,
      error: 'businessId and reviewId are required',
    };
  }

  const owner_reply_body = patch.ownerReplyBody;
  const owner_replied_at =
    owner_reply_body === null ? null : new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({ owner_reply_body, owner_replied_at })
      .eq('id', trimmedReviewId)
      .eq('business_id', trimmedBusinessId)
      .select(REVIEW_SELECT)
      .maybeSingle();

    if (error) {
      console.error('[reviews] updateDashboardReview failed', error);
      return {
        ok: false,
        status: 500,
        error: error.message || 'Failed to update review',
      };
    }

    if (!data) {
      return { ok: false, status: 404, error: 'Review not found' };
    }

    const review = tryMapReviewRowToDashboardReview(
      data as ReviewRowForDashboard
    );
    if (!review) {
      return { ok: false, status: 500, error: 'Invalid review data returned' };
    }

    return { ok: true, review };
  } catch (err) {
    console.error('[reviews] updateDashboardReview failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Unexpected error updating review',
    };
  }
}
