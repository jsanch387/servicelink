import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { DashboardReview } from '@/features/reviews/dashboard/types';
import type { PublicProfileReview } from '@/features/reviews/types/publicProfile';
import { deriveReviewsSummary } from '@/features/reviews/utils/deriveReviewsSummary';

export type GoogleReviewRow = {
  id: string;
  author_display_name: string;
  rating: number;
  body: string;
  provider_create_time: string;
  owner_reply_body: string | null;
  owner_replied_at: string | null;
};

const SELECT =
  'id, author_display_name, rating, body, provider_create_time, owner_reply_body, owner_replied_at';

export function mapGoogleReviewRowToPublic(
  row: unknown
): PublicProfileReview | null {
  if (!row || typeof row !== 'object') return null;
  const record = row as Partial<GoogleReviewRow>;
  if (typeof record.id !== 'string' || !record.id.trim()) return null;
  if (
    typeof record.author_display_name !== 'string' ||
    !record.author_display_name.trim()
  ) {
    return null;
  }
  if (
    typeof record.rating !== 'number' ||
    !Number.isFinite(record.rating) ||
    record.rating < 1 ||
    record.rating > 5
  ) {
    return null;
  }
  if (
    typeof record.provider_create_time !== 'string' ||
    !record.provider_create_time.trim()
  ) {
    return null;
  }

  return {
    id: `google:${record.id.trim()}`,
    authorDisplayName: record.author_display_name.trim(),
    rating: Math.round(record.rating),
    body: typeof record.body === 'string' ? record.body : '',
    createdAt: record.provider_create_time.trim(),
    source: 'google',
    ownerReply:
      record.owner_reply_body && record.owner_replied_at
        ? { body: record.owner_reply_body, repliedAt: record.owner_replied_at }
        : undefined,
  };
}

export async function loadPublicGoogleReviews(businessId: string): Promise<{
  reviews: PublicProfileReview[];
  count: number;
}> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('google_reviews')
    .select(SELECT)
    .eq('business_id', businessId)
    .order('provider_create_time', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[reviews:google-connect] public load failed', error);
    return { reviews: [], count: 0 };
  }

  const reviews = ((data ?? []) as unknown[])
    .map(row => mapGoogleReviewRowToPublic(row))
    .filter((review): review is PublicProfileReview => review !== null);
  return { reviews, count: reviews.length };
}

export async function countPublicGoogleReviews(
  businessId: string
): Promise<number> {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from('google_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId);

  if (error) {
    console.error('[reviews:google-connect] count failed', error);
    return 0;
  }
  return count ?? 0;
}

export async function loadDashboardGoogleReviews(
  businessId: string
): Promise<DashboardReview[]> {
  const { reviews } = await loadPublicGoogleReviews(businessId);
  return reviews.map(review => ({ ...review, isHidden: false }));
}

export function googleReviewsSummaryFromList(reviews: PublicProfileReview[]) {
  return reviews.length > 0 ? deriveReviewsSummary(reviews) : null;
}
