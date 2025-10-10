/**
 * API Route: Business Profile Slug Management
 *
 * Endpoints:
 * POST /api/business-profile/slug - Create/update business slug
 * GET /api/business-profile/slug/[businessId] - Get existing slug
 * GET /api/business-profile/slug/check/[slug] - Check slug availability
 */

import { slugService } from '@/features/business-profile/services/slugService';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/business-profile/slug - Create business slug
export async function POST(request: NextRequest) {
  console.log(
    '🚀 [API] POST /api/business-profile/slug - Creating business slug'
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

    // Parse request body
    const body = await request.json();
    const { businessProfileId, slugInput } = body;

    if (!businessProfileId || !slugInput) {
      console.log('❌ [API] Missing required fields');
      return NextResponse.json(
        {
          success: false,
          error: 'Business profile ID and slug input are required',
        },
        { status: 400 }
      );
    }

    console.log('📝 [API] Request data:', {
      businessProfileId,
      slugInput: slugInput.substring(0, 50) + '...', // Log truncated for privacy
    });

    // Verify user owns this business profile
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id, business_name')
      .eq('id', businessProfileId)
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('❌ [API] Business profile not found or not owned by user');
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    console.log('✅ [API] Business profile verified:', {
      id: profile.id,
      businessName: profile.business_name,
    });

    // Create the slug using the service
    const result = await slugService.createBusinessSlug(
      businessProfileId,
      slugInput
    );

    if (!result.success) {
      console.log('❌ [API] Slug creation failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    console.log('✅ [API] Slug created successfully:', {
      businessProfileId: result.data!.businessProfileId,
      slug: result.data!.slug,
      link: result.data!.fullLink,
    });

    return NextResponse.json({
      success: true,
      data: {
        slug: result.data!.slug,
        fullLink: result.data!.fullLink,
        businessProfileId: result.data!.businessProfileId,
      },
    });
  } catch (error) {
    console.error('❌ [API] Unexpected error creating slug:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/business-profile/slug/[businessId] - Get existing slug
export async function GET(request: NextRequest) {
  console.log(
    '🔍 [API] GET /api/business-profile/slug - Getting business slug'
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

    // Get business profile ID from query params
    const { searchParams } = new URL(request.url);
    const businessProfileId = searchParams.get('businessProfileId');

    if (!businessProfileId) {
      console.log('❌ [API] Missing business profile ID');
      return NextResponse.json(
        { success: false, error: 'Business profile ID is required' },
        { status: 400 }
      );
    }

    console.log(
      '📝 [API] Getting slug for business profile:',
      businessProfileId
    );

    // Verify user owns this business profile
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id, business_name, business_slug, business_link')
      .eq('id', businessProfileId)
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('❌ [API] Business profile not found or not owned by user');
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    if (!profile.business_slug || !profile.business_link) {
      console.log('ℹ️ [API] Business profile has no slug configured');
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    console.log('✅ [API] Retrieved slug data:', {
      businessProfileId: profile.id,
      businessName: profile.business_name,
      slug: profile.business_slug,
      link: profile.business_link,
    });

    return NextResponse.json({
      success: true,
      data: {
        slug: profile.business_slug,
        fullLink: profile.business_link,
        businessProfileId: profile.id,
      },
    });
  } catch (error) {
    console.error('❌ [API] Unexpected error getting slug:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
