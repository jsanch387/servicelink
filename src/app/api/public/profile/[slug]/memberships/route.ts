import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { isProAccess } from '@/features/pricing';
import type { OwnerSubscriptionFieldsForPortfolio } from '@/features/pricing/utils/maxPortfolioImagesForSubscription';
import { loadPublicMembershipPlans } from '@/features/subscriptions/server/loadPublicMembershipPlans';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { assertPublicProfileGetRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/public/profile/[slug]/memberships
 * Published plans — fetched when the customer opens the Subscriptions tab.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const trimmedSlug = slug?.trim();

  if (!trimmedSlug) {
    return NextResponse.json(
      { success: false, error: 'Slug is required' },
      { status: 400 }
    );
  }

  try {
    const rateLimited = await assertPublicProfileGetRateLimits(
      request,
      trimmedSlug
    );
    if (rateLimited) return rateLimited;

    const admin = createSupabaseAdminClient();
    if (!(await isPublicBusinessSlugVisible(admin, trimmedSlug))) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: profileData, error: profileError } = await supabase
      .from('business_profiles')
      .select('id, profile_id')
      .eq('business_slug', trimmedSlug)
      .maybeSingle();
    const businessId = (profileData as { id?: string } | null)?.id?.trim();
    const profileId = (profileData as { profile_id?: string | null } | null)
      ?.profile_id;

    if (profileError || !businessId) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    const ownerProfileResult = profileId
      ? await admin
          .from('profiles')
          .select(
            'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
          )
          .eq('user_id', profileId)
          .maybeSingle()
      : { data: null };

    const owner = (ownerProfileResult.data ??
      null) as OwnerSubscriptionFieldsForPortfolio | null;
    const ownerHasPro = isProAccess(
      owner?.subscription_tier,
      owner?.subscription_current_period_end,
      owner?.subscription_status,
      owner?.stripe_subscription_id,
      owner?.stripe_customer_id
    );

    const plans = await loadPublicMembershipPlans(admin, businessId, {
      ownerHasPro,
    });

    return NextResponse.json({ success: true, data: { plans } });
  } catch (err) {
    console.error('[memberships] GET public profile memberships failed', err);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
