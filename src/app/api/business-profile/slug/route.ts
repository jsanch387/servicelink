/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API Route: Business Profile Slug Management
 *
 * Endpoints:
 * POST /api/business-profile/slug - Create/update business slug
 * GET /api/business-profile/slug/[businessId] - Get existing slug
 * GET /api/business-profile/slug/check/[slug] - Check slug availability
 */

import { slugService } from '@/features/business-profile/services/slugService';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/business-profile/slug - Create business slug
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { businessProfileId, slugInput, advanceOnboardingStep } = body;

    if (!businessProfileId || !slugInput) {
      return NextResponse.json(
        {
          success: false,
          error: 'Business profile ID and slug input are required',
        },
        { status: 400 }
      );
    }

    // Verify user owns this business profile
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id, business_name')
      .eq('id', businessProfileId)
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Normalize to lowercase so we never store mixed-case slugs (e.g. EliteDetail → elitedetail)
    const normalizedInput = String(slugInput).trim().toLowerCase();

    // Create the slug using the service (service also enforces lowercase and char limit)
    const result = await slugService.createBusinessSlug(
      String(businessProfileId),
      normalizedInput
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // When called from onboarding step 4, advance to step 5
    if (advanceOnboardingStep === true) {
      const { error: stepError } = await (supabase as any)
        .from('profiles')
        .update({
          onboarding_step: 5,
          onboarding_status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (stepError) {
        return NextResponse.json(
          { success: false, error: stepError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        slug: result.data!.slug,
        fullLink: result.data!.fullLink,
        businessProfileId: result.data!.businessProfileId,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/business-profile/slug/[businessId] - Get existing slug
export async function GET(request: NextRequest) {
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

    // Get business profile ID from query params
    const { searchParams } = new URL(request.url);
    const businessProfileId = searchParams.get('businessProfileId');

    if (!businessProfileId) {
      return NextResponse.json(
        { success: false, error: 'Business profile ID is required' },
        { status: 400 }
      );
    }

    // Verify user owns this business profile
    const { data: profile, error: profileError } = await (supabase as any)
      .from('business_profiles')
      .select('id, business_name, business_slug, business_link')
      .eq('id', businessProfileId)
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    if (!(profile as any).business_slug || !(profile as any).business_link) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        slug: (profile as any).business_slug,
        fullLink: (profile as any).business_link,
        businessProfileId: (profile as any).id,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
