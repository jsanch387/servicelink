/**
 * In-app notification + Expo push after a customer submits a review.
 * Best-effort; failures must not affect the HTTP response (review already saved).
 */

import {
  notificationInboxSubtitleFromCustomer,
  notificationMinimalDisplayTitle,
} from '@/features/notifications/utils/notificationMinimalDisplayTitle';
import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function notifyOwnerForReviewSubmitted(
  admin: SupabaseClient<Database>,
  params: {
    businessId: string;
    reviewId: string;
    customerName: string;
  }
): Promise<void> {
  const { businessId, reviewId, customerName } = params;

  const { data: profileRow, error: profileErr } = await admin
    .from('business_profiles')
    .select('profile_id')
    .eq('id', businessId)
    .maybeSingle();

  if (profileErr) {
    console.warn(
      '[notifyOwnerForReviewSubmitted] business_profiles lookup failed',
      {
        businessId,
        reviewId,
        message: profileErr.message,
      }
    );
    return;
  }

  const profileId =
    (profileRow as { profile_id?: string | null } | null)?.profile_id?.trim() ??
    null;

  if (!profileId) {
    console.warn(
      '[notifyOwnerForReviewSubmitted] No owner profile_id; skipping',
      {
        businessId,
        reviewId,
      }
    );
    return;
  }

  const title = notificationMinimalDisplayTitle(
    'review_submitted',
    'review',
    'New review'
  );
  const bodyText = notificationInboxSubtitleFromCustomer(customerName);
  const trimmedCustomerName = customerName.trim();

  try {
    const notificationRow: Database['public']['Tables']['notifications']['Insert'] =
      {
        user_id: profileId,
        type: 'review_submitted',
        reference_type: 'review',
        reference_id: reviewId,
        title,
        body: bodyText,
        dedupe_key: `review:${reviewId}`,
        metadata: trimmedCustomerName
          ? { customerName: trimmedCustomerName }
          : null,
      };
    await admin.from('notifications').insert(notificationRow as never);
  } catch (e) {
    console.warn('[notifyOwnerForReviewSubmitted] notification insert failed', {
      reviewId,
      profileId,
      message: e instanceof Error ? e.message : String(e),
    });
  }

  await sendExpoPushToUser(admin, {
    userId: profileId,
    title,
    body: bodyText,
    data: { reference_type: 'review', reference_id: reviewId },
  });
}
