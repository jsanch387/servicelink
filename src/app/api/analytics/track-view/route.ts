/**
 * Track Profile View API
 *
 * POST /api/analytics/track-view
 * Records a page_view in public_analytics_events (short dedup per visitor).
 */

import { deriveVisitorKey } from '@/features/analytics/server/deriveVisitorKey';
import { hasRecentPageView } from '@/features/analytics/server/hasRecentPageView';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { assertPublicTrackViewRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest, NextResponse } from 'next/server';

type AnalyticsProfileRow = {
  id: string;
  profile_views: number | null;
  last_viewed_at?: string | null;
};

type PublicAnalyticsEventInsert = {
  business_profile_id: string;
  event_type: 'page_view';
  visitor_key: string;
  path: string;
  metadata: Record<string, never>;
};

export async function POST(request: NextRequest) {
  try {
    const { businessSlug } = await request.json();

    if (!businessSlug) {
      return NextResponse.json(
        { success: false, error: 'Business slug is required' },
        { status: 400 }
      );
    }

    const slug = String(businessSlug).trim();

    const rateLimited = await assertPublicTrackViewRateLimits(request, slug);
    if (rateLimited) return rateLimited;

    const admin = createSupabaseAdminClient();
    if (!(await isPublicBusinessSlugVisible(admin, slug))) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    const { data: profileData, error: profileError } = await admin
      .from('business_profiles')
      .select('id, profile_views')
      .eq('business_slug', slug)
      .single();
    const profile = profileData as AnalyticsProfileRow | null;

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    const visitorKey = deriveVisitorKey(request);

    if (await hasRecentPageView(admin, profile.id, visitorKey)) {
      return NextResponse.json({
        success: true,
        data: {
          recorded: false,
          businessProfileId: profile.id,
        },
      });
    }

    const eventRow: PublicAnalyticsEventInsert = {
      business_profile_id: profile.id,
      event_type: 'page_view',
      visitor_key: visitorKey,
      path: `/${slug}`,
      metadata: {},
    };

    const { error: insertError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin as any).from('public_analytics_events').insert(eventRow);

    if (insertError) {
      console.error('Error inserting analytics event:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to record analytics' },
        { status: 500 }
      );
    }

    // Keep legacy counters in sync until dashboard reads from events.
    const { data: updatedProfileData, error: updateError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin as any)
        .from('business_profiles')
        .update({
          profile_views: (profile.profile_views || 0) + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select('profile_views, last_viewed_at');
    const updatedProfile = updatedProfileData as AnalyticsProfileRow | null;

    if (updateError || !updatedProfile) {
      console.error('Error updating profile view counters:', updateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        recorded: true,
        businessProfileId: profile.id,
        profileViews: updatedProfile?.profile_views ?? undefined,
        lastViewedAt: updatedProfile?.last_viewed_at ?? undefined,
      },
    });
  } catch (error) {
    console.error('❌ [Analytics] Error tracking view:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
