/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Public API Endpoint: Get Business Profile by Slug
 *
 * GET /api/public/profile/[slug]
 *
 * Fetches a business profile by its slug without requiring authentication.
 * Used for public profile viewing.
 */

import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { resolveMaxPortfolioImagesForBusiness } from '@/features/business-profile/server/resolveMaxPortfolioImagesForBusiness';
import { sortServicesForDisplay } from '@/features/services/categories/utils/sortServicesForDisplay';
import type { ServiceCategoryRow } from '@/features/services/categories/types/serviceCategories';
import type { ServiceRow } from '@/features/services/types/services';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database } from '@/libs/supabase/client';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { assertPublicProfileGetRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest, NextResponse } from 'next/server';

type PublicBusinessProfileRow =
  Database['public']['Tables']['business_profiles']['Row'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const rateLimited = await assertPublicProfileGetRateLimits(request, slug);
    if (rateLimited) return rateLimited;

    const admin = createSupabaseAdminClient();
    if (!(await isPublicBusinessSlugVisible(admin, slug))) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Get business profile by slug
    const { data: profileData, error: profileError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('business_slug', slug)
      .single();
    const profile = profileData as PublicBusinessProfileRow | null;

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Get services and categories (bucket-scoped sort applied in app)
    const [servicesResult, categoriesResult] = await Promise.all([
      supabase
        .from('business_services')
        .select('*')
        .eq('business_id', profile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
      supabase
        .from('service_categories')
        .select('*')
        .eq('business_id', profile.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ]);

    if (servicesResult.error) {
      // Services fetch failed, continue with empty array
    }

    const services = sortServicesForDisplay(
      (servicesResult.data ?? []) as ServiceRow[],
      (categoriesResult.data ?? []) as ServiceCategoryRow[]
    );

    // Get portfolio images
    const { data: images, error: imagesError } = await supabase
      .from('business_images')
      .select('*')
      .eq('business_id', profile.id)
      .order('position', { ascending: true });

    if (imagesError) {
      // Images fetch failed, continue with empty array
    }

    const maxPortfolio = await resolveMaxPortfolioImagesForBusiness(
      admin as any,
      profile.id
    );
    const imagesForResponse = (images || []).slice(0, maxPortfolio);

    // Construct complete business profile response
    const completeProfile = {
      ...profile,
      services,
      images: imagesForResponse,
    };

    return NextResponse.json({
      success: true,
      data: completeProfile,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
