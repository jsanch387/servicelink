/**
 * API Route: Settings Page Data
 *
 * GET /api/settings/page-data
 * Returns all data needed for the settings page including business profile and slug information
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface SettingsPageData {
  businessProfile: {
    id: string;
    business_name: string;
    business_type: string | null;
    service_area: string | null;
    bio: string | null;
    created_at: string;
    updated_at: string;
  };
  slugData: {
    hasSlug: boolean;
    slug?: string;
    fullLink?: string;
  } | null;
}

export async function GET(_request: NextRequest) {
  console.log(
    '📊 [API] GET /api/settings/page-data - Fetching settings page data'
  );

  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ [API] User not authenticated');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ [API] Authenticated user:', user.id);

    // Fetch business profile data
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select(
        'id, business_name, business_type, service_area, bio, created_at, updated_at, business_slug, business_link'
      )
      .eq('profile_id', user.id)
      .single();

    if (profileError || !businessProfile) {
      console.log('❌ [API] Business profile not found');
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    console.log('✅ [API] Business profile found:', {
      id: businessProfile.id,
      businessName: businessProfile.business_name,
    });

    // Check if user has a slug configured
    const hasSlug = !!(
      businessProfile.business_slug && businessProfile.business_link
    );

    const settingsData: SettingsPageData = {
      businessProfile: {
        id: businessProfile.id,
        business_name: businessProfile.business_name,
        business_type: businessProfile.business_type,
        service_area: businessProfile.service_area,
        bio: businessProfile.bio,
        created_at: businessProfile.created_at,
        updated_at: businessProfile.updated_at,
      },
      slugData: hasSlug
        ? {
            hasSlug: true,
            slug: businessProfile.business_slug,
            fullLink: businessProfile.business_link,
          }
        : {
            hasSlug: false,
          },
    };

    console.log('✅ [API] Settings data prepared:', {
      businessProfileId: settingsData.businessProfile.id,
      hasSlug: settingsData.slugData?.hasSlug,
      slug: settingsData.slugData?.slug,
    });

    return NextResponse.json({
      success: true,
      data: settingsData,
    });
  } catch (error) {
    console.error('❌ [API] Unexpected error fetching settings data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
