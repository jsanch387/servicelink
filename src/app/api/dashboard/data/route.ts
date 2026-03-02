/**
 * API Route: Dashboard Data
 *
 * GET /api/dashboard/data
 * Returns all data needed for the dashboard including business profile, slug status, and analytics
 */

import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextResponse } from 'next/server';

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

    // Fetch business profile with all related data
    const {
      data: businessProfile,
      error: profileError,
    }: {
      data: {
        id: string;
        business_name: string;
        business_type: string | null;
        service_area: string | null;
        bio: string | null;
        created_at: string;
        updated_at: string;
        business_slug: string | null;
        business_link: string | null;
        services: unknown;
        images: unknown;
      } | null;
      error: unknown;
    } = await supabase
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
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Check if user has a slug configured
    const hasSlug = !!(
      businessProfile.business_slug && businessProfile.business_link
    );

    // Prepare slug data
    const slugData = hasSlug
      ? {
          hasSlug: true,
          slug: businessProfile.business_slug ?? undefined,
          fullLink: businessProfile.business_link ?? undefined,
          createdAt: businessProfile.updated_at,
        }
      : {
          hasSlug: false,
        };

    // Calculate analytics
    const servicesCount =
      (businessProfile.services as { length: number })?.length || 0;
    const imagesCount =
      (businessProfile.images as { length: number })?.length || 0;

    // Calculate profile completeness (0-100%)
    let completenessScore = 0;
    const checks = [
      businessProfile.business_name,
      businessProfile.business_type,
      businessProfile.service_area,
      businessProfile.bio && businessProfile.bio.trim().length >= 50,
      hasSlug,
      servicesCount > 0,
      imagesCount > 0,
    ];
    completenessScore = Math.round(
      (checks.filter(Boolean).length / checks.length) * 100
    );

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
        !!businessProfile.bio &&
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
        profileCompleteness: completenessScore,
      },
      nextSteps,
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
