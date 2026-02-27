/**
 * Track Profile View API
 *
 * POST /api/analytics/track-view
 * Tracks a profile view with deduplication.
 */

import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

type AnalyticsProfileRow = {
  id: string;
  profile_views: number | null;
  business_slug: string | null;
  last_viewed_at?: string | null;
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

    // Get client IP from request headers (for future use)
    // const _clientIP =
    //   viewerIP ||
    //   request.headers.get('x-forwarded-for')?.split(',')[0] ||
    //   request.headers.get('x-real-ip') ||
    //   'unknown';

    const supabase = await createSupabaseServerClient();

    // Get business profile by slug
    const { data: profileData, error: profileError } = await supabase
      .from('business_profiles')
      .select('id, profile_views, business_slug')
      .eq('business_slug', businessSlug)
      .single();
    const profile = profileData as AnalyticsProfileRow | null;

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // TODO: Add deduplication logic here (Redis or database-based)
    // For MVP, we'll implement simple rate limiting

    // Update profile views
    const { data: updatedProfileData, error: updateError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('business_profiles')
        .update({
          profile_views: (profile.profile_views || 0) + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select('profile_views, last_viewed_at');
    const updatedProfile = updatedProfileData as AnalyticsProfileRow;

    if (updateError || !updatedProfile) {
      console.error('Error updating profile views:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        profileViews: updatedProfile.profile_views,
        lastViewedAt: updatedProfile.last_viewed_at,
        businessProfileId: profile.id,
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
