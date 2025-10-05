/**
 * API Route: Dashboard Data
 *
 * GET /api/dashboard/data
 * Returns all data needed for the dashboard including business profile, slug status, and analytics
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface DashboardData {
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
    createdAt?: string;
  } | null;
  analytics: {
    servicesCount: number;
    imagesCount: number;
    profileCompleteness: number;
  };
  nextSteps: {
    needsSlug: boolean;
    needsServices: boolean;
    needsImages: boolean;
    needsBio: boolean;
    readyToShare: boolean;
  };
}

export async function GET(_request: NextRequest) {
  console.log('📊 [API] GET /api/dashboard/data - Fetching dashboard data');

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

    // Fetch business profile with all related data
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select(
        `
        id, business_name, business_type, service_area, bio, created_at, updated_at,
        business_slug, business_link,
        services:business_services(count),
        images:business_images(count)
      `
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

    // Prepare slug data
    const slugData = hasSlug
      ? {
          hasSlug: true,
          slug: businessProfile.business_slug,
          fullLink: businessProfile.business_link,
          createdAt: businessProfile.updated_at, // When slug was last updated
        }
      : {
          hasSlug: false,
        };

    // Calculate analytics
    const servicesCount = (businessProfile.services as any)?.length || 0;
    const imagesCount = (businessProfile.images as any)?.length || 0;

    // Calculate profile completeness (0-100%)
    let completeness = 0;
    if (businessProfile.business_name) completeness += 20;
    if (businessProfile.business_type) completeness += 15;
    if (businessProfile.bio) completeness += 20;
    if (servicesCount > 0) completeness += 25;
    if (imagesCount > 0) completeness += 20;

    // Determine next steps
    const nextSteps = {
      needsSlug: !hasSlug,
      needsServices: servicesCount === 0,
      needsImages: imagesCount === 0,
      needsBio: !businessProfile.bio || businessProfile.bio.trim().length < 50,
      readyToShare:
        hasSlug &&
        servicesCount > 0 &&
        imagesCount > 0 &&
        businessProfile.bio &&
        businessProfile.bio.trim().length >= 50,
    };

    const dashboardData: DashboardData = {
      businessProfile: {
        id: businessProfile.id,
        business_name: businessProfile.business_name,
        business_type: businessProfile.business_type,
        service_area: businessProfile.service_area,
        bio: businessProfile.bio,
        created_at: businessProfile.created_at,
        updated_at: businessProfile.updated_at,
      },
      slugData,
      analytics: {
        servicesCount,
        imagesCount,
        profileCompleteness: Math.round(completeness),
      },
      nextSteps,
    };

    console.log('✅ [API] Dashboard data prepared:', {
      businessProfileId: dashboardData.businessProfile.id,
      hasSlug: dashboardData.slugData?.hasSlug,
      slug: dashboardData.slugData?.slug,
      completeness: dashboardData.analytics.profileCompleteness,
      readyToShare: dashboardData.nextSteps.readyToShare,
    });

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('❌ [API] Unexpected error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
