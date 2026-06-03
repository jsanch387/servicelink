import type { SupabaseClient } from '@supabase/supabase-js';
import type { DashboardReview } from '../types';
import {
  tryMapReviewRowToDashboardReview,
  type ReviewRowForDashboard,
} from './mapReviewRowToDashboardReview';

const DEFAULT_LIMIT = 100;

export type LoadDashboardReviewsResult =
  | { ok: true; reviews: DashboardReview[] }
  | { ok: false; status: number; error: string };

const REVIEW_LIST_SELECT =
  'id, author_display_name, rating, body, created_at, owner_reply_body, owner_replied_at, is_hidden';

/**
 * Owner inbox: all reviews for the business (including hidden).
 * Scoped by RLS to the authenticated owner's `business_id`.
 */
export async function loadDashboardReviews(
  supabase: SupabaseClient,
  businessId: string,
  options?: { limit?: number }
): Promise<LoadDashboardReviewsResult> {
  const trimmedBusinessId = businessId?.trim();
  if (!trimmedBusinessId) {
    return { ok: false, status: 400, error: 'businessId is required' };
  }

  const limit = options?.limit ?? DEFAULT_LIMIT;

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(REVIEW_LIST_SELECT)
      .eq('business_id', trimmedBusinessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[reviews] loadDashboardReviews query failed', error);
      return {
        ok: false,
        status: 500,
        error: error.message || 'Failed to load reviews',
      };
    }

    const rows = (data ?? []) as ReviewRowForDashboard[];
    const reviews = rows
      .map(row => tryMapReviewRowToDashboardReview(row))
      .filter((review): review is DashboardReview => review !== null);

    if (rows.length > reviews.length) {
      console.warn('[reviews] loadDashboardReviews skipped invalid rows', {
        businessId: trimmedBusinessId,
        skipped: rows.length - reviews.length,
      });
    }

    return { ok: true, reviews };
  } catch (err) {
    console.error('[reviews] loadDashboardReviews failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Unexpected error loading reviews',
    };
  }
}
