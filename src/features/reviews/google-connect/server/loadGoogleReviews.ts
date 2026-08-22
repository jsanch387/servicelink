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

function mapRow(row: GoogleReviewRow): PublicProfileReview {
  return {
    id: `google:${row.id}`,
    authorDisplayName: row.author_display_name,
    rating: row.rating,
    body: row.body ?? '',
    createdAt: row.provider_create_time,
    source: 'google',
    ownerReply:
      row.owner_reply_body && row.owner_replied_at
        ? { body: row.owner_reply_body, repliedAt: row.owner_replied_at }
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

  const reviews = (data ?? []).map(row => mapRow(row as GoogleReviewRow));
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

export function googleReviewsSummaryFromList(
  reviews: PublicProfileReview[]
) {
  return reviews.length > 0 ? deriveReviewsSummary(reviews) : null;
}
