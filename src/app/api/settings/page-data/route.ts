/**
 * API Route: Settings Page Data
 *
 * GET /api/settings/page-data
 * Returns all data needed for the settings page including business profile and slug information
 */

import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextResponse } from 'next/server';

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

export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch business profile data
    const { data: businessProfileRow, error: profileError } = await supabase
      .from('business_profiles')
      .select(
        'id, business_name, business_type, service_area, bio, created_at, updated_at, business_slug, business_link'
      )
      .eq('profile_id', user.id)
      .single();

    const businessProfile = businessProfileRow as {
      id: string;
      business_name: string;
      business_type: string | null;
      service_area: string | null;
      bio: string | null;
      created_at: string;
      updated_at: string;
      business_slug: string | null;
      business_link: string | null;
    } | null;

    if (profileError || !businessProfile) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

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
            slug: businessProfile.business_slug ?? undefined,
            fullLink: businessProfile.business_link ?? undefined,
          }
        : {
            hasSlug: false,
          },
    };

    return NextResponse.json({
      success: true,
      data: settingsData,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
